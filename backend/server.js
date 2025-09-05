import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/users.js';
import tournamentRoutes from './routes/tournament.js';
import remoteGameRoutes from './routes/remoteGameRoutes.js';
import friendsRoutes from './routes/friendsRoute.js';
import profileRoutes from './routes/profileRoutes.js';

import { globalErrorHandler } from './utils/errorHandler.js';
import { trackUserActivity } from './services/lastSeenService.js';
import { getSecrets } from './services/vaultService.js';
import dotenv from 'dotenv';
import cookie from '@fastify/cookie';
import {prisma } from './prisma/prisma_lib.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

dotenv.config();

const fastify = Fastify();
fastify.setErrorHandler(globalErrorHandler);

// Needed to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Register plugins BEFORE starting server
fastify.register(fastifyCors, {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
});


import fastifyPassport from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as jwt from './services/jwtService.js';

// Register plugins BEFORE starting server
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});
fastify.register(fastifyWebsocket);
fastify.register(swagger, {
  swagger: {
    info: { title: 'fastify-api', version: '1.0.0' },
  },
});
fastify.register(cookie);
fastify.register(fastifyMultipart, {
  limits: { file: 1, filesize: 5 * 1024 * 1024 },
});
fastify.register(swaggerUI, {
  routePrefix: '/docs',
  exposeRoute: true,
});
fastify.register(helmet, {
  contentSecurityPolicy: false, // Completely disable CSP
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
});
fastify.register(rateLimit, {
  max: 20,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'],
  skip: (request) => request.headers.upgrade && request.headers.upgrade.toLowerCase() === 'websocket'
});
fastify.register(fastifySecureSession, {
  key: Buffer.from(process.env.SESSION_SECRET, 'hex'), // 32 bytes hex string
  cookie: { path: '/' }
});
fastify.register(fastifyPassport.initialize());
fastify.register(fastifyPassport.secureSession());

// Register Google OAuth strategy
fastifyPassport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  // Example using Prisma:
  let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        // add other fields as needed
      }
    });
  }
  return done(null, user);
}));
fastifyPassport.registerUserSerializer(async (user, req) => user);
fastifyPassport.registerUserDeserializer(async (user, req) => user);

// Google OAuth routes
fastify.get('/auth/google',
  { preValidation: fastifyPassport.authenticate('google', { scope: ['profile', 'email'] }) },
  async (req, reply) => {}
);

fastify.get('/auth/google/callback',
  { preValidation: fastifyPassport.authenticate('google', { failureRedirect: '/' }) },
  async (req, reply) => {
    // Generate JWT and set cookie
    // TODO: Use real user info from DB
    const token = jwt.generateToken({ id: req.user.id || req.user.id, email: req.user.emails?.[0]?.value });
    reply.setCookie('token', token, { httpOnly: true, secure: true, sameSite: 'lax' });
    reply.redirect('/dashboard'); // or  frontend route
  }
);

// /api/me route
fastify.get('/api/me', async (req, reply) => {
  // TODO: verify JWT and return user info
  reply.send({ user: req.user || null });
});

// // /api/auth/logout route
// fastify.post('/api/auth/logout', async (req, reply) => {
//   reply.clearCookie('token').send({ message: 'Logged out' });
// });

// Register routes
fastify.register(tournamentRoutes, { prefix: '/api' });
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(friendsRoutes, { prefix: '/api' });
fastify.register(profileRoutes, { prefix: '/api' });
fastify.register(remoteGameRoutes);

setupGracefulShutdown(fastify, prisma);

// Start the server (must be last)
await fastify.listen({ port: 3000, host: '0.0.0.0' });

// 🔹 After server boot, safe to use secrets or configs
const secrets = await getSecrets();
const jwtSecret = secrets.JWT_SECRET;
const dbPassword = secrets.DB_PASSWORD;

