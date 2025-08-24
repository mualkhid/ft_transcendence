import {prisma} from '../prisma/prisma_lib.js'

import path from 'path'
import {pipeline} from 'stream'
import { promisify } from 'util'
const pump = promisify(pipeline)

import {ValidationError, AuthenticationError, notFoundError } from '../utils/errors.js'

const sanitizedUserSelect = { id: true, username: true, email: true, createdAt: true, updatedAt: true }

export async function getCurrentUser(req, reply) {
	
	const id = 2 // from jwt token
	
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
	const id = 2; // from jwt token
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
	const id = 2 // jwt later
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
	console.log("entered")
	const id = 2 // to be replaced by jwt
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


/*
User's computer: photo.jpg
       ↓ (upload)
Server receives: binary data
       ↓ (save)
Server disk: /uploads/avatars/user-2-1692345678.jpg
       ↓ (return URL)
Frontend gets: "/uploads/avatars/user-2-1692345678.jpg"
       ↓ (can now display)
<img src="/uploads/avatars/user-2-1692345678.jpg"></img>
*/