import {
  registerUser,
  login,
  getCurrentUser,
  logout,
  setup2FA
} from '../controller/authController.js';

import {
  registerUserOpts,
  loginOpts,
  getCurrentUserOpts,
  logoutOpts,
  registerSchema
} from '../schema/authSchema.js';
import { authenticate } from '../services/jwtService.js';

// Fastify ESM plugin: default export
export default function authRoutes(fastify, _opts, done) {
  fastify.post('/api/auth/registerUser', registerUserOpts, registerUser);
  fastify.post('/api/auth/login', loginOpts, login);
  fastify.get('/api/auth/me', { preHandler: authenticate }, getCurrentUser);
  fastify.post('/api/auth/logout', logoutOpts, logout);
  fastify.post('/api/auth/setup-2fa', { preHandler: authenticate }, setup2FA);
  done();
}
