import {prisma} from '../prisma/prisma_lib.js'
import validator from 'validator'
import * as img from '../services/imageService.js';
import path from 'node:path';
import {ValidationError, AuthenticationError, notFoundError } from '../utils/errors.js'

const AVATARS_DIR = path.join(process.cwd(), 'public', 'avatars');
const TMP_DIR      = path.join(AVATARS_DIR, '_tmp');

const sanitizedUserSelect = { 
    id: true, 
    username: true, 
    email: true, 
    createdAt: true, 
    updatedAt: true,
    gamesPlayed: true,
    wins: true,
    losses: true,
    avatarUrl: true
}

export async function getCurrentUser(req, reply) {
	
	const id = req.user.id // Get user ID from JWT token
	
	const user = await prisma.user.findUnique({
		where: {id: id},
		select : sanitizedUserSelect,
	})

	if (!user)
		throw new notFoundError('user not found')

	return reply.status(200).send({ user: user });
}

export async function updateUsername (req, reply)
{
	const id = req.user.id; // Get user ID from JWT token
	const {newUsername} = req.body
	if (newUsername === req.user.username)
		throw new ValidationError("Username is the same as the old one")

    if (!validator.isAlphanumeric(newUsername))
        throw new ValidationError("username should consist of letters and digits")

	const updatedUser = await prisma.user.update({
		where: {id: id},
		data: {username: newUsername.trim()},
		select: {
			id: true,
			username: true,
			email:true, 

		}
	})
	return reply.status(200).send({message: 'username updated successfully'})
}

export async function updatePassword (req, reply)
{
	const id = req.user.id // Get user ID from JWT token
	const {currentPassword, newPassword} = req.body

	if (currentPassword === newPassword)
		return reply.status(400).send({message: 'current password cant be the same as new password'})

	// Import bcrypt for password comparison
	const bcrypt = await import('bcrypt');

	const user = await prisma.user.findUnique({
		where :{id: id},
		select: {
			id: true,
			passwordHash: true
		}
	})
	if (!user)
		throw new notFoundError('user not found')

	// Compare current password with stored hash
	const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
	if (!isCurrentPasswordValid)
		throw new AuthenticationError('password Incorrect');

	// Hash the new password
	const newPasswordHash = await bcrypt.hash(newPassword, 12);

	await prisma.user.update ({
		where: {id: id},
		data: {passwordHash: newPasswordHash}
	})
	return reply.status(200).send({message: 'password updated successfully'})
}

export async function updateAvatar(req, reply)
{
	const id = req.user.id;

	const file = await req.file();

	img.assertFilePresent(file);
	img.assertAllowedMime(file.mimetype);

	await img.ensureDir(TMP_DIR);
	await img.ensureDir(AVATARS_DIR);

	const tmpName = `${crypto.randomUUID()}.upload`;
	const tmpPath = img.buildPath(TMP_DIR, tmpName);

	await img.writeStreamToFile(file.file, tmpPath);

	img.assertNotTruncated(file);           // from multipart limits
	await img.assertMagicMimeAllowed(tmpPath);
	
	const ext = img.deduceExtensionFromMime(file.mimetype);
	
	const filename = img.buildAvatarFilename(id, ext);
	const destPath = img.buildPath(AVATARS_DIR, filename);
	
	// 5) Commit: move tmp -> final (atomic)
	await img.deleteUserAvatars(id)
	await (await import('node:fs/promises')).rename(tmpPath, destPath);
	
	// 6) Persist URL
	const publicUrl = img.buildPublicUrl(filename);
	await prisma.user.update({ where: { id }, data: { avatarUrl: publicUrl } });

	return reply.status(200).send({ avatarUrl: publicUrl });
}

export async function updateStats(req, reply) {
    const userId = req.user.id; // Get user ID from JWT token
    const { won, gameType = 'LOCAL', player1Score, player2Score, opponentName, gameDuration } = req.body;

    if (typeof won !== 'boolean') {
        return reply.status(400).send({ error: 'won field must be a boolean' });
    }

    try {
        // Get current user stats
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                lastSeen: true,
                gamesPlayed: true,
                wins: true,
                losses: true
            }
        });

        if (!user) {
            throw new notFoundError('User not found');
        }

        // Save game result as a match record for all game types
        if ((gameType === 'AI' || gameType === 'LOCAL' || gameType === 'MULTIPLAYER' || gameType === 'TOURNAMENT') && player1Score !== undefined && player2Score !== undefined) {
            try {
                // Determine player2Alias based on game type
                let player2Alias;
                if (gameType === 'AI') {
                    player2Alias = 'AI';
                } else if (gameType === 'LOCAL') {
                    player2Alias = 'Local Player';
                } else {
                    player2Alias = opponentName || 'Opponent';
                }

                const now = new Date();
                const durationMs = gameDuration || 60000; // Use provided duration or default to 1 minute
                const startTime = new Date(now.getTime() - durationMs);

                const match = await prisma.match.create({
                    data: {
                        tournamentId: gameType === 'TOURNAMENT' ? 1 : null, // Set tournament ID for tournament games
                        roundNumber: 1,
                        matchNumber: 1,
                        status: 'FINISHED',
                        player1Alias: user.username,
                        player2Alias: player2Alias,
                        winnerAlias: won ? user.username : player2Alias,
                        startedAt: startTime,
                        finishedAt: now
                    }
                });

                // Create match players with scores
                await prisma.matchPlayer.createMany({
                    data: [
                        {
                            matchId: match.id,
                            alias: user.username,
                            score: won ? player1Score : player2Score,
                            result: won ? 'WIN' : 'LOSS'
                        },
                        {
                            matchId: match.id,
                            alias: player2Alias,
                            score: won ? player2Score : player1Score,
                            result: won ? 'LOSS' : 'WIN'
                        }
                    ]
                });

            } catch (error) {
                console.error(`Failed to save ${gameType} game result:`, error);
                // Continue with stats update even if match saving fails
            }
        }

        // Update user stats in database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                gamesPlayed: user.gamesPlayed + 1,
                wins: won ? user.wins + 1 : user.wins,
                losses: won ? user.losses : user.losses + 1
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                lastSeen: true,
                gamesPlayed: true,
                wins: true,
                losses: true
            }
        });
        
        return reply.status(200).send({
            message: 'Game completed successfully',
            user: updatedUser,
            gameResult: won ? 'won' : 'lost'
        });
    } catch (error) {
        console.error('Error updating user stats:', error);
        return reply.status(500).send({ error: 'Failed to update user stats' });
    }
}