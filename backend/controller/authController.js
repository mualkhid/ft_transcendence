// ESM: no module.exports; use named exports

export const dummyUser = {
	id: "dummyID",
	username: "dummy",
	email: "dummy@gmail.com",
	createdAt: "2025-08-13T04:11:52.079Z",
	updatedAt: "2025-08-13T04:11:52.079Z"
};

export function registerUser(req, reply) {
	const { username, email, password } = req.body;
	const now = new Date().toISOString();

	// TODO: insert into SQLite and read back id/createdAt/updatedAt from DB
	return reply.status(201).send({
		user: {
		id: "randID",
		username,
		email,
		createdAt: now,
		updatedAt: now
		}
	});
}

export function login(req, reply) {
	// const { email, password } = req.body;
	// console.log(req.body);

	return reply.status(200).send({ user: dummyUser });
}

export function getCurrentUser(req, reply) {
	// should read user from JWT/session later
	return reply.status(200).send({ user: dummyUser });
}

export function logout(req, reply) {
	return reply.status(200).send({ message: "logged-out" });
}
