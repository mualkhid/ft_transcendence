import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookie from '@fastify/cookie';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/users.js';
import tournamentRoutes from './routes/tournament.js';
import remoteGameRoutes from './routes/remoteGameRoutes.js';
import friendsRoutes from './routes/friendsRoute.js';
import profileRoutes from './routes/profileRoutes.js';
import aiGameRoutes from './routes/aiGameRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import { globalErrorHandler } from './utils/errorHandler.js';
import { prisma } from './prisma/prisma_lib.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

dotenv.config();

const fastify = Fastify({
  trustProxy: [
    '127.0.0.1',        // localhost
    '::1',              // IPv6 localhost
    '10.0.0.0/8',       // Docker default networks
    '172.16.0.0/12',    // Docker default networks
    '172.18.0.0/16',    // Docker compose networks
    '172.19.0.0/16',    // Docker compose networks
    '172.20.0.0/16',    // Docker compose networks  
    '192.168.0.0/16'    // Private networks
  ]
});

fastify.setErrorHandler(globalErrorHandler);

// Needed to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await fastify.register(cookie);

// 2) CORS (allow 10.1*.*.* + localhost; works with credentials)
await fastify.register(cors, {
  origin: [
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    /^https:\/\/10\.1\d{1,2}\.\d+\.\d+(:\d+)?$/
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
});

fastify.addHook('onRequest', (request, reply, done) => {
  console.log("--------------------------\n");
  console.log("Incoming Request");
  console.log("Method:", request.method, "  URL:", request.url);
  console.log("--------------------------\n");
  done();
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', 
});

await fastify.register(fastifyWebsocket);

fastify.register(fastifyMultipart, {
  limits: { file: 1, filesize: 5 * 1024 * 1024 },
});

await fastify.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
});


await fastify.register(rateLimit, {
  hook: 'preHandler',
  max: 500,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1', ''],
  keyGenerator: (request) => request.user?.id ? `user:${request.user.id}` : `ip:${request.ip}`,
  skip: (request) => request.headers.upgrade && request.headers.upgrade.toLowerCase() === 'websocket'
});

fastify.register(tournamentRoutes, { prefix: '/api' });
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(friendsRoutes, { prefix: '/api' });
fastify.register(profileRoutes, { prefix: '/api' });
fastify.register(remoteGameRoutes, { prefix: '/api' });
fastify.register(aiGameRoutes, { prefix: '/api' });
fastify.register(dashboardRoutes, { prefix: '/api' });

// 🔹 Start server LAST
setupGracefulShutdown(fastify, prisma);
console.log('Attempting to start server...');
const address = await fastify.listen({ port: 3000, host: '0.0.0.0' });
console.log(`Server running at ${address}`);

console.log('✅ Server started successfully');