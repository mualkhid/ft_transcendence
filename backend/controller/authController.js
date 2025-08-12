const registerUser = (req, reply) => {
	const {username, email, password} = req.body


	reply.send({reply: `${username}, with email ${email} is registered`})
}

module.exports = {
	registerUser,
}