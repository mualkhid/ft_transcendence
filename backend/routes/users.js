const { registerUser, getAliases } = require('../controller/userController');
const { registerSchema, getAliasSchema } = require('../schema/userSchema');

async function userRoutes(fastify, options)
{
    fastify.post('/register', {schema : registerSchema}, registerUser);
    fastify.get('/aliases', { schema : getAliasSchema }, getAliases);
}

module.exports = userRoutes;