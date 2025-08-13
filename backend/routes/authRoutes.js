const {registerUser, login, getCurrentUser, logout, } = require('../controller/authController')

const {registerUserOpts, loginOpts, getCurrentUserOpts, logoutOpts,} = require('../schema/authSchema')

// User Schema we should create to be returned in each request that requires it
function authRoutes(fastify, options)
{
  // route | schema | handler function
  fastify.post('/auth/registerUser', registerUserOpts, registerUser);

  fastify.post('/auth/login', loginOpts,  login);

  fastify.get('/auth/me', getCurrentUserOpts, getCurrentUser);

  fastify.post('/auth/logout', logoutOpts, logout);
}

module.exports = authRoutes
