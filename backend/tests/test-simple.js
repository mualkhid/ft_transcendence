import Fastify from 'fastify';

const fastify = Fastify({
  logger: true
});

// Register a simple route
fastify.get('/test', async (request, reply) => {
  return { message: 'Fastify is working!' };
});

console.log('🔌 Test route registered');

// Start server
try {
  console.log('Starting server...');
  await fastify.listen({ port: 3001, host: '0.0.0.0' });
  console.log('✅ Server started on port 3001');
} catch (err) {
  console.error('Server startup error:', err);
  process.exit(1);
}
