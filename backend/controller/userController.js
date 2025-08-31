const bcrypt = require('bcrypt');
const { runQuery, getQuery, allQuery } = require('../database');

// User registration
async function registerUser(request, reply) {
    try {
        const { username, email, password } = request.body;

        // Check if user already exists
        const existingUser = await getQuery(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return reply.status(409).send({ 
                error: 'Username or email already exists' 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await runQuery(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        const user = await getQuery(
            'SELECT id, username, email, avatar_url, games_played, wins, losses, created_at FROM users WHERE id = ?',
            [result.id]
        );

        reply.status(201).send({
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        console.error('Registration error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// User login
async function loginUser(request, reply) {
    try {
        const { email, password } = request.body;

        // Find user by email
        const user = await getQuery(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        // Update last seen
        await runQuery(
            'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate JWT token
        const token = await reply.jwtSign({
            userId: user.id,
            username: user.username,
            email: user.email
        });

        reply.status(200).send({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                games_played: user.games_played,
                wins: user.wins,
                losses: user.losses,
                two_factor_enabled: user.two_factor_enabled
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Get user profile
async function getUserProfile(request, reply) {
    try {
        const userId = request.user.userId;

        const user = await getQuery(
            'SELECT id, username, email, avatar_url, games_played, wins, losses, two_factor_enabled, created_at, last_seen FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        reply.status(200).send({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Update user profile
async function updateUserProfile(request, reply) {
    try {
        const userId = request.user.userId;
        const { username, email, two_factor_enabled, availability } = request.body;

        // Check if username/email already exists
        if (username) {
            const existingUser = await getQuery(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
            );
            if (existingUser) {
                return reply.status(409).send({ error: 'Username already exists' });
            }
        }

        if (email) {
            const existingUser = await getQuery(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (existingUser) {
                return reply.status(409).send({ error: 'Email already exists' });
            }
        }

        // Update user
        let updateQuery = 'UPDATE users SET ';
        let params = [];
        let updates = [];

        if (username) {
            updates.push('username = ?');
            params.push(username);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (two_factor_enabled !== undefined) {
            updates.push('two_factor_enabled = ?');
            params.push(two_factor_enabled);
        }
        if (availability !== undefined) {
            updates.push('availability = ?');
            params.push(availability);
        }

        if (updates.length === 0) {
            return reply.status(400).send({ error: 'No fields to update' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        params.push(userId);

        await runQuery(updateQuery, params);

        // Get updated user data
        const updatedUser = await getQuery(
            'SELECT id, username, email, avatar_url, games_played, wins, losses, two_factor_enabled, availability FROM users WHERE id = ?',
            [userId]
        );

        reply.status(200).send({ 
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Upload avatar
async function uploadAvatar(request, reply) {
    try {
        const data = await request.file();
        const userId = request.user.id;
        
        if (!data) {
            return reply.code(400).send({ success: false, message: 'No file uploaded' });
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(data.mimetype)) {
            return reply.code(400).send({ 
                success: false, 
                message: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' 
            });
        }
        
        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (data.file.bytesRead > maxSize) {
            return reply.code(413).send({ 
                success: false, 
                message: 'File too large. Maximum size is 10MB.' 
            });
        }
        
        // Create avatars directory if it doesn't exist
        const fs = require('fs');
        const path = require('path');
        const avatarsDir = path.join(__dirname, '..', 'avatars');
        if (!fs.existsSync(avatarsDir)) {
            fs.mkdirSync(avatarsDir, { recursive: true });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = path.extname(data.filename);
        const avatarFilename = `avatar_${userId}_${timestamp}${fileExtension}`;
        const avatarPath = path.join(avatarsDir, avatarFilename);
        
        // Save file
        const buffer = await data.toBuffer();
        fs.writeFileSync(avatarPath, buffer);
        
        // Update database
        const db = require('../database').getDatabase();
        const avatarUrl = `/avatars/${avatarFilename}`;
        
        db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, userId);
        
        reply.send({ 
            success: true, 
            message: 'Avatar uploaded successfully',
            avatar_url: avatarUrl
        });
        
    } catch (error) {
        console.error('Avatar upload error:', error);
        if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
            return reply.code(413).send({ 
                success: false, 
                message: 'File too large. Maximum size is 10MB.' 
            });
        }
        reply.code(500).send({ 
            success: false, 
            message: 'Failed to upload avatar' 
        });
    }
},
    
    async updateGameStats(request, reply) {
        try {
            const userId = request.user.id;
            const { games_played, wins, losses } = request.body;
            
            if (typeof games_played !== 'number' || typeof wins !== 'number' || typeof losses !== 'number') {
                return reply.code(400).send({ 
                    success: false, 
                    message: 'Invalid game statistics data' 
                });
            }
            
            const db = require('../database').getDatabase();
            
            // Get current stats
            const currentStats = db.prepare('SELECT games_played, wins, losses FROM users WHERE id = ?').get(userId);
            
            if (!currentStats) {
                return reply.code(404).send({ 
                    success: false, 
                    message: 'User not found' 
                });
            }
            
            // Update stats
            const newGamesPlayed = (currentStats.games_played || 0) + games_played;
            const newWins = (currentStats.wins || 0) + wins;
            const newLosses = (currentStats.losses || 0) + losses;
            
            db.prepare('UPDATE users SET games_played = ?, wins = ?, losses = ? WHERE id = ?').run(
                newGamesPlayed, newWins, newLosses, userId
            );
            
            reply.send({ 
                success: true, 
                message: 'Game statistics updated successfully',
                stats: {
                    games_played: newGamesPlayed,
                    wins: newWins,
                    losses: newLosses
                }
            });
            
        } catch (error) {
            console.error('Game stats update error:', error);
            reply.code(500).send({ 
                success: false, 
                message: 'Failed to update game statistics' 
            });
        }
    }

// Get all users (for friends search)
async function getAllUsers(request, reply) {
    try {
        const users = await allQuery(
            'SELECT id, username, email, avatar_url, games_played, wins, losses, created_at, last_seen FROM users ORDER BY username'
        );

        reply.status(200).send({ users });
    } catch (error) {
        console.error('Get users error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Search users
async function searchUsers(request, reply) {
    try {
        const { query } = request.query;
        
        if (!query || query.length < 2) {
            return reply.status(400).send({ error: 'Search query must be at least 2 characters' });
        }

        const users = await allQuery(
            'SELECT id, username, email, avatar_url, games_played, wins, losses, created_at, last_seen FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY username',
            [`%${query}%`, `%${query}%`]
        );

        reply.status(200).send({ users });
    } catch (error) {
        console.error('Search users error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    uploadAvatar,
    getAllUsers,
    searchUsers
};