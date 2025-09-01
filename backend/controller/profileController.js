import {prisma} from '../prisma/prisma_lib.js'

import path from 'path'
import {pipeline} from 'stream'
import { promisify } from 'util'
const pump = promisify(pipeline)

import {ValidationError, AuthenticationError, notFoundError } from '../utils/errors.js'

const sanitizedUserSelect = { 
    id: true, 
    username: true, 
    email: true, 
    createdAt: true, 
    updatedAt: true,
    gamesPlayed: true,
    wins: true,
    losses: true
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

	const updatedUser = await prisma.user.update({
		where: {id: id},
		data: {username: newUsername.trim().toLowerCase()},
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


	const user = await prisma.user.findUnique({
		where :{id: id},
		select: {
			id: true,
			passwordHash: true
		}
	})
	if (!user)
		throw new notFoundError('user not found')

	if (currentPassword != user.passwordHash)
		throw new AuthenticationError('password Incorrect');
		

	await prisma.user.update ({
		where: {id: id},
		data: {passwordHash: newPassword}
	})
	return reply.status(200).send({message: 'password updated successfully'})
}

export async function updateAvatar(req, reply)
{
	const id = req.user.id // Get user ID from JWT token
	const file = await req.file()
	if (!file)
		throw new notFoundError('No file uploaded')

	const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
	if (!allowed.has(file.mimetype))
		return reply.status(415).send({error: 'Unsupported file type'})
	
	
	const ext = file.mimetype === 'image/jpeg' ? 'jpg'
	: file.mimetype === 'image/png'  ? 'png'
	: 'webp';
	
	const filename = `${id}.${ext}`
	const destPath = path.join (process.cwd(), 'public', 'avatars', filename)
	const writeStream = (await import('fs')).createWriteStream(destPath)
	await pump(file.file, writeStream)
	
	if (file.file.truncated)
		return reply.status(413).send({error: 'File too large'})
	const publicUrl = `/avatars/${filename}`

	await prisma.user.update ({
		where : {id: id},
		data: {avatarUrl: publicUrl},
	})

	return reply.status(200).send({avatarUrl: publicUrl});

}


export async function updateStats(req, reply) {
    const userId = req.user.id; // Get user ID from JWT token
    const { won } = req.body;

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