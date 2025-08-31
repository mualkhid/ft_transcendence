const fastify = require('fastify')({ 
    logger: true,
    trustProxy: true
});

// Import database and initialize it
const { initDatabase } = require('./database');

// Import routes
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const friendsRoutes = require('./routes/friends');
const tournamentRoutes = require('./routes/tournament');

// Register plugins
fastify.register(require('@fastify/cors'), {
    origin: true,
    credentials: true
});

fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
});

// Register multipart for file uploads
fastify.register(require('@fastify/multipart'), {
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    }
});

// Swagger documentation
fastify.register(require('@fastify/swagger'), {
    swagger: {
        info: {
            title: 'Powerpuff Pong API',
            description: 'A multiplayer Pong game with tournaments',
            version: '1.0.0',
        },
        host: 'localhost:3000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
            { name: 'auth', description: 'Authentication endpoints' },
            { name: 'users', description: 'User management endpoints' },
            { name: 'games', description: 'Game endpoints' },
            { name: 'friends', description: 'Friends management endpoints' },
            { name: 'tournaments', description: 'Tournament endpoints' }
        ]
    }
});

fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    exposeRoute: true,
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    }
});

// Authentication middleware
fastify.decorate('authenticate', async function(request, reply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

// Register routes
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(gameRoutes, { prefix: '/api' });
fastify.register(friendsRoutes, { prefix: '/api' });
fastify.register(tournamentRoutes, { prefix: '/api' });

// Serve avatar files
fastify.get('/avatars/*', async (request, reply) => {
    const filePath = request.params['*'];
    const fullPath = `./avatars/${filePath}`;
    
    try {
        const fs = require('fs');
        if (fs.existsSync(fullPath)) {
            const stream = fs.createReadStream(fullPath);
            reply.type('image/*');
            return reply.send(stream);
        } else {
            reply.status(404).send({ error: 'Avatar not found' });
        }
    } catch (error) {
        reply.status(500).send({ error: 'Internal server error' });
    }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    return { status: 'OK', timestamp: new Date().toISOString() };
});

// Root endpoint
fastify.get('/', async (request, reply) => {
    return { 
        message: 'Powerpuff Pong API', 
        version: '1.0.0',
        docs: '/docs'
    };
});

// Start server
const start = async () => {
    try {
        // Initialize database
        await initDatabase();
        console.log('Database initialized successfully');

        // Start server
        await fastify.listen({ 
            port: 3000, 
            host: '0.0.0.0' 
        });
        
        console.log('Server is running on http://localhost:3000');
        console.log('API Documentation available at http://localhost:3000/docs');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();