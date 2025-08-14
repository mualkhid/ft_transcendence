// ESM: no module.exports; use named exports
import {prisma} from '../server.js';

export const dummyUser = {
	id: "dummyID",
	username: "dummy",
	email: "dummy@gmail.com",
	createdAt: "2025-08-13T04:11:52.079Z",
	updatedAt: "2025-08-13T04:11:52.079Z"
};

export async function registerUser(req, reply) {
	const { username, email, password } = req.body;

	const user = await prisma.user.create({data: {
		username: username,
		email: email,
		passwordHash: password
	}})
	console.log(user)

	return reply.status(201).send({
		user: {
		id: user.id,
		username: user.username,
		email: user.email,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt
		}
	});
}

export function login(req, reply) {
	const { email, password } = req.body;
	// console.log(req.body);

	// prisma.findFirst()
	// its a good idea to disconnect from prisma once you
	// finish writing your code, i dont know if its after every statement or no
	
	return reply.status(200).send({ user: dummyUser });
}

export function getCurrentUser(req, reply) {
	// should read user from JWT/session later
	return reply.status(200).send({ user: dummyUser });
}

export function logout(req, reply) {
	return reply.status(200).send({ message: "logged-out" });
}
