import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournament.js';
import remoteGameRoutes from './routes/remoteGameRoutes.js';
import friendsRoutes from './routes/friendsRoute.js';
import profileRoutes from './routes/profileRoutes.js';

import { globalErrorHandler } from './utils/errorHandler.js';
import { trackUserActivity } from './services/lastSeenService.js';

import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import helmet from '@fastify/helmet';

const fastify = Fastify();
fastify.setErrorHandler(globalErrorHandler)
fastify.addHook('preHandler', trackUserActivity)

// import friendsRoutes from './routes/friendsRoute.js'

import { getSecrets } from './services/vaultService.js';

dotenv.config();

export const prisma = new PrismaClient({log: ['query', 'info', 'warn', 'error'] });

// Needed to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from "public" folder
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', // serve at root URL
});

//Fatsify UI register
await fastify.register(fastifyWebsocket);

fastify.register(swagger, {
  swagger: {
    info: {
      title: 'fastify-api',
      version: '1.0.0',
    },
  },
});

// used for uploading files
fastify.register(fastifyMultipart, {
  limits: {
    file: 1,
    filesize: 5 * 1024 * 1024
  }
});

fastify.register(swaggerUI, {
  routePrefix: '/docs',
  exposeRoute: true,
});


// Transcendence routes
fastify.register(tournamentRoutes); // maybe we should add api prefix
fastify.register(remoteGameRoutes); // maybe we should add api prefix
fastify.register(authRoutes)
fastify.register(friendsRoutes)
fastify.register(profileRoutes)

// Start server with error handling
try {
  const address = await fastify.listen({ 
    port: 3000, 
    host: '0.0.0.0'
});
  console.log(`Server running at ${address}`);
} catch (err) {
  fastify.log.error("catched in server => ", err);
  process.exit(1);
}
// Register rate limiting
fastify.register(rateLimit, {
  max: 20, // max requests per timeWindow
  timeWindow: '1 minute', // per minute
  allowList: ['127.0.0.1'] // allow localhost unlimited
});

// Register helmet for security
await fastify.register(helmet);

// fastify.register(friendsRoutes);

const secrets = await getSecrets();
const jwtSecret = secrets.JWT_SECRET;
const dbPassword = secrets.DB_PASSWORD;

