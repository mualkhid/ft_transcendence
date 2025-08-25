import {
  registerUser,
  login,
  logout
} from '../controller/authController.js';

import {
  registerUserOpts,
  loginOpts,
  logoutOpts
} from '../schema/authSchema.js';

export default function authRoutes(fastify, _opts, done) {
  fastify.post('/api/auth/registerUser', registerUserOpts, registerUser);
  fastify.post('/api/auth/login', loginOpts, login);
  fastify.post('/api/auth/logout', logoutOpts,  logout);
  done();
}

