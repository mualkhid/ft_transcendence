const {registerUser, login, logout} = require('../controller/authController')

const {registerUserOpts, loginOpts, logoutOpts

} = require('../schema/authSchema')

// User Schema we should create to be returned in each request that requires it
function authRoutes(fastify, options)
{
  // route | schema | handler function
  fastify.post('/auth/registerUser', registerUserOpts, registerUser);

  fastify.post('/auth/login', loginOpts,  login);

  // fastify.get('/auth/me', {schema: getCurrentUserSchema}, getCurrentUser);

  fastify.post('/auth/logout', logoutOpts, logout);
}

module.exports = authRoutes
