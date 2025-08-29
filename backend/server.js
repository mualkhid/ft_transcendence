import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
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
// fastify.addHook('preHandler', trackUserActivity);

// Needed to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Register plugins BEFORE starting server
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', 
});

await fastify.register(fastifyWebsocket);


fastify.register(swagger, {
  swagger: {
    info: { title: 'fastify-api', version: '1.0.0' },
  },
});

// In your server.js or main file

// Register the cookie plugin
fastify.register(cookie);

fastify.register(fastifyMultipart, {
  limits: { file: 1, filesize: 5 * 1024 * 1024 },
});

fastify.register(swaggerUI, {
  routePrefix: '/docs',
  exposeRoute: true,
});

//Munia Please check if this interferes with your work or not I closed it for websockets to work  -Sumaya 
await fastify.register(helmet, {
  contentSecurityPolicy: false, // Completely disable CSP
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
});

// //Security + Rate limiting
fastify.register(rateLimit, {
  max: 20,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'],
  skip: (request) => request.headers.upgrade && request.headers.upgrade.toLowerCase() === 'websocket'
});



// 🔹 Register routes
fastify.register(tournamentRoutes, { prefix: '/api' });
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(friendsRoutes, { prefix: '/api' });
fastify.register(profileRoutes, { prefix: '/api' });

fastify.register(remoteGameRoutes);

setupGracefulShutdown(fastify, prisma);

// 🔹 Start server LAST
try {
  const address = await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log(`Server running at ${address}`);
} catch (err) {
  fastify.log.error("catched in server => ", err);
  process.exit(1);
}

// 🔹 After server boot, safe to use secrets or configs
const secrets = await getSecrets();
const jwtSecret = secrets.JWT_SECRET;
const dbPassword = secrets.DB_PASSWORD;
