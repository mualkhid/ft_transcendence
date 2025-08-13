import {
  registerUser,
  login,
  getCurrentUser,
  logout
} from '../controller/authController.js';

import {
  registerUserOpts,
  loginOpts,
  getCurrentUserOpts,
  logoutOpts
} from '../schema/authSchema.js';

// Fastify ESM plugin: default export
export default function authRoutes(fastify, _opts, done) {
  fastify.post('/auth/registerUser', registerUserOpts, registerUser);
  fastify.post('/auth/login', loginOpts, login);
  fastify.get ('/auth/me', getCurrentUserOpts, getCurrentUser);
  fastify.post('/auth/logout', logoutOpts,  logout);
  done();
}
