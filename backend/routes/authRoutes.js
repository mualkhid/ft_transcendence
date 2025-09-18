import {
  registerUser,
  login,
  logout,
  setup2FA,
  refreshToken,
  verify2FA,
  disable2FA
} from '../controller/authController.js';

import {
  handleGoogleAuth,
  handleGoogleCallback
} from '../services/googleAuthService.js';

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
  
  // 2FA Routes
  fastify.post('/auth/setup-2fa', { preHandler: authenticate }, setup2FA);
  fastify.post('/auth/verify-2fa', { preHandler: authenticate }, verify2FA);
  fastify.post('/auth/disable-2fa', { preHandler: authenticate }, disable2FA);

  // Google OAuth endpoints
  fastify.get('/auth/google', handleGoogleAuth);
  fastify.get('/auth/google/callback', handleGoogleCallback);

  done();
}
