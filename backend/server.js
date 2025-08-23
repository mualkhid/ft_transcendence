import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

import usersRoutes from './routes/users.js';
import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournament.js';
import remoteGameRoutes from './routes/remoteGameRoutes.js';
import friendsRoutes from './routes/friendsRoute.js';
import profileRoutes from './routes/profileRoutes.js';

// import prisma from './prisma/prisma_lib.js'

const fastify = Fastify();

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
await fastify.register(fastifyMultipart, {
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
fastify.register(usersRoutes);
fastify.register(tournamentRoutes);
fastify.register(remoteGameRoutes);
fastify.register(authRoutes);
fastify.register(friendsRoutes);
fastify.register(profileRoutes);

// Start server with error handling
try {
  const address = await fastify.listen({ port: 3000 });
  console.log(`Server running at ${address}`);
} catch (err) {
  fastify.log.error("catched in server => ", err);
  process.exit(1);
}
