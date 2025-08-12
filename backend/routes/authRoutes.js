const {registerUser} = require('../controller/authController')

const registerUserOpts = require('../schema/authSchema')

// User Schema we should create to be returned in each request that requires it
function authRoutes(fastify, options)
{
  // route | schema | handler function
  fastify.post('/auth/registerUser', registerUserOpts, registerUser);

  // fastify.get('/auth/login', {schema: loginSchema}, login);

  // fastify.get('/auth/me', {schema: getCurrentUserSchema}, getCurrentUser);

  // fastify.get('auht/logout', {schema: logoutSchema}, logout);
}

module.exports = authRoutes
