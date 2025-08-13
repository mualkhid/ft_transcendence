
const dummyUser = {
		id: "dummyID",
		username: "dummy",
		email: "dummy@gmail.com",
		createdAt: "2025-08-13T04:11:52.079Z",
		updatedAt: "2025-08-13T04:11:52.079Z"
}


const registerUser = (req, reply) => {
	const {username, email, password} = req.body
	let user = {username, email, password }

	// should return sanitized user
	// i will be using sqlite id generator and stringify it before sending + createdAt, updatedAt will also be generated from db
	const now = new Date().toISOString()
	reply.status(201).send({
		user: {id: 'randID', username: user.username, email: user.email, createdAt: now, updatedAt: now}})
}

const login = (req, reply) => {
	// const {email, password} = req.body
	console.log(req.body)

	// should return sanitized user
	reply.status(200).send({
		user: dummyUser
	})
}

const getCurrentUser = (req, reply) => {
	console.log(req.body)
	// should know the user from the JWT token

	reply.status(200).send({
		user: dummyUser
	})
}

const logout = (req, reply) => {
	// const {email, password} = req.body
	console.log(req.body)

	reply.status(200).send({
		message: "logged-out"
	})
}




module.exports = {
	registerUser,
	login,
	getCurrentUser,
	logout,
}