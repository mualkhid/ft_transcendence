import {prisma} from '../prisma/prisma_lib.js'
import { AuthenticationError} from '../utils/errors.js';

const sanitizedUserSelect = { id: true, username: true, email: true, createdAt: true, lastSeen: true, updatedAt: true }
export async function registerUser(req, reply) {
	const { username, email, password } = req.body;
	const passwordHash = password // Hash the password properly
 
	const user = await prisma.user.create({
		data: {
			username: username,
			email: email,
			passwordHash: passwordHash
		}
	});
 
	// generate new token and save it to the header
	return reply.status(201).send({
		user: {
			id: user.id,
			username: user.username.toLowerCase(),
			email: user.email.toLowerCase(),
			createdAt: user.createdAt,
			lastSeen: user.lastSeen,
			updatedAt: user.updatedAt
		}
	});
 }
 
 export async function login(req, reply) {
	const { email, password } = req.body;
	
	const user = await prisma.user.findUnique({
		where: { email: email.toLowerCase() },
	});
 
	// compare with bcrypt instead
	if (!user || user.passwordHash !== password) {
		throw new AuthenticationError('Invalid email or password');
	}
		
	const loggedInUser = await prisma.user.update({
		where: { id: user.id },
		data: { lastSeen: new Date() },
		select: sanitizedUserSelect,
	});
 
	return reply.status(200).send({ user: loggedInUser });
 }
 
 export function logout(req, reply) {
	// token removal should be from client side (should be deleted from local storage)
	return reply.status(200).send({ message: "logged-out" });
 }