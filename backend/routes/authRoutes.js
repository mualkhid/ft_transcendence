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
  fastify.post('/auth/registerUser', registerUserOpts, registerUser);
  fastify.post('/auth/login', loginOpts, login);
  fastify.post('/auth/logout', logoutOpts,  logout);
  done();
}

