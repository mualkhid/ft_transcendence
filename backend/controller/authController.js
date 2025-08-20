// ESM: no module.exports; use named exports
// import {prisma} from '../server.js';
import {prisma} from '../prisma/prisma_lib.js'


const sanitizedUserSelect = { id: true, username: true, email: true, createdAt: true, updatedAt: true }

export async function registerUser(req, reply) {
	const { username, email, password } = req.body;
	const passwordHash = password // call the function instead

	const user = await prisma.user.create({data: {
		username: username,
		email: email,
		passwordHash: passwordHash
	}})
	console.log(user)

	// generate new token
	return reply.status(201).send({
		user: {
		id: user.id,
		username: user.username.toLowerCase(),
		email: user.emailtoLowerCase(),
		passwordHash: password,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt
		}
	});
}
// i am thinking of a way to retrieve and update in one database query -> transactions
export async function login(req, reply) {
	const { email, password } = req.body;
	
	await prisma.$transaction (async (tx) => {

		const user = await tx.user.findUnique({
			where: { email: email.toLowerCase() },
		});
	
		if (!user || user.passwordHash !== password)
			return reply.code(401).send({ error: 'Incorrect credentials' });
			
		const loggedInUser = await tx.user.update ({
			where: { id: user.id },
			data: { lastSeen: new Date() },
			select: sanitizedUserSelect,
		})
		return reply.status(200).send({ user: loggedInUser });	
	});
}

export async function getCurrentUser(req, reply) {
	
	const id = req.query.id
	
	const user = await prisma.user.findUnique({
		where: {id: Number(id)},
		select : sanitizedUserSelect,
	})

	if (!user)
		return reply.code(401).send({ error: 'Incorrect credentials' });

	return reply.status(200).send({ user: user });
}

export function logout(req, reply) {
	return reply.status(200).send({ message: "logged-out" });
}
