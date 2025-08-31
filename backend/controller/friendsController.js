const { runQuery, getQuery, allQuery } = require('../database');

// Send friend request
async function sendFriendRequest(request, reply) {
    try {
        const userId = request.user.userId;
        const { friendId } = request.body;

        if (userId === friendId) {
            return reply.status(400).send({ error: 'Cannot send friend request to yourself' });
        }

        // Check if friend request already exists
        const existingRequest = await getQuery(
            'SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [userId, friendId, friendId, userId]
        );

        if (existingRequest) {
            return reply.status(409).send({ error: 'Friend request already exists' });
        }

        // Check if friend exists
        const friend = await getQuery('SELECT id, username FROM users WHERE id = ?', [friendId]);
        if (!friend) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Create friend request
        await runQuery(
            'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
            [userId, friendId, 'pending']
        );

        reply.status(201).send({
            message: `Friend request sent to ${friend.username}`,
            friend: { id: friend.id, username: friend.username }
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Accept friend request
async function acceptFriendRequest(request, reply) {
    try {
        const userId = request.user.userId;
        const { friendId } = request.params;

        // Find and update friend request
        const result = await runQuery(
            'UPDATE friendships SET status = ? WHERE friend_id = ? AND user_id = ? AND status = ?',
            ['accepted', userId, friendId, 'pending']
        );

        if (result.changes === 0) {
            return reply.status(404).send({ error: 'Friend request not found' });
        }

        reply.status(200).send({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Accept friend request error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Reject friend request
async function rejectFriendRequest(request, reply) {
    try {
        const userId = request.user.userId;
        const { friendId } = request.params;

        // Delete friend request
        const result = await runQuery(
            'DELETE FROM friendships WHERE friend_id = ? AND user_id = ? AND status = ?',
            [userId, friendId, 'pending']
        );

        if (result.changes === 0) {
            return reply.status(404).send({ error: 'Friend request not found' });
        }

        reply.status(200).send({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Reject friend request error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Get friend requests
async function getFriendRequests(request, reply) {
    try {
        const userId = request.user.userId;

        const requests = await allQuery(
            `SELECT f.*, u.username, u.avatar_url, u.last_seen, u.created_at as user_created_at
             FROM friendships f
             JOIN users u ON f.user_id = u.id
             WHERE f.friend_id = ? AND f.status = ?
             ORDER BY f.created_at DESC`,
            [userId, 'pending']
        );

        reply.status(200).send({ requests });
    } catch (error) {
        console.error('Get friend requests error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Get friends list
async function getFriendsList(request, reply) {
    try {
        const userId = request.user.userId;

        const friends = await allQuery(
            `SELECT u.id, u.username, u.avatar_url, u.last_seen, u.created_at as user_created_at,
                    CASE 
                        WHEN u.last_seen > datetime('now', '-5 minutes') THEN 'online'
                        ELSE 'offline'
                    END as status
             FROM friendships f
             JOIN users u ON (f.user_id = u.id OR f.friend_id = u.id)
             WHERE (f.user_id = ? OR f.friend_id = ?) 
             AND f.status = 'accepted'
             AND u.id != ?
             ORDER BY u.username`,
            [userId, userId, userId]
        );

        reply.status(200).send({ friends });
    } catch (error) {
        console.error('Get friends list error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Remove friend
async function removeFriend(request, reply) {
    try {
        const userId = request.user.userId;
        const { friendId } = request.params;

        // Delete friendship
        const result = await runQuery(
            'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
            [userId, friendId, friendId, userId]
        );

        if (result.changes === 0) {
            return reply.status(404).send({ error: 'Friendship not found' });
        }

        reply.status(200).send({ message: 'Friend removed' });
    } catch (error) {
        console.error('Remove friend error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Search for users to add as friends
async function searchUsersForFriends(request, reply) {
    try {
        const userId = request.user.userId;
        const { query } = request.query;

        if (!query || query.length < 2) {
            return reply.status(400).send({ error: 'Search query must be at least 2 characters' });
        }

        // Get users that match search and are not already friends
        const users = await allQuery(
            `SELECT u.id, u.username, u.email, u.avatar_url, u.games_played, u.wins, u.losses, u.created_at, u.last_seen
             FROM users u
             WHERE (u.username LIKE ? OR u.email LIKE ?)
             AND u.id != ?
             AND u.id NOT IN (
                 SELECT CASE 
                     WHEN user_id = ? THEN friend_id 
                     ELSE user_id 
                 END
                 FROM friendships 
                 WHERE (user_id = ? OR friend_id = ?)
             )
             ORDER BY u.username`,
            [`%${query}%`, `%${query}%`, userId, userId, userId, userId]
        );

        reply.status(200).send({ users });
    } catch (error) {
        console.error('Search users for friends error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
    getFriendsList,
    removeFriend,
    searchUsersForFriends
};
