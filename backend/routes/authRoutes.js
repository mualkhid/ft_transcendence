import {
  registerUser,
  login,
  logout,
  setup2FA,
  refreshToken
} from '../controller/authController.js';

import {
  registerUserOpts,
  loginOpts,
  logoutOpts,
} from '../schema/authSchema.js';
import { authenticate } from '../services/jwtService.js';

export default function authRoutes(fastify, _opts, done) {
  fastify.post('/auth/registerUser', registerUserOpts, registerUser);
  fastify.post('/auth/login', loginOpts, login);
  fastify.post('/auth/logout', {preHandler: authenticate}, logout);
  fastify.post('/auth/refresh', {preHandler: authenticate}, refreshToken);
  fastify.post('/auth/setup-2fa', { preHandler: authenticate }, setup2FA);
  done();
}
