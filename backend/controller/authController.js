const registerUser = (req, reply) => {
	console.log(req)
	const {name} = req.body

	reply.send({reply: `${name} is registered`})
}

module.exports = {
	registerUser,
}