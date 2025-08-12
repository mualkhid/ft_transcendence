const fastify = require('fastify')({ logger: true });

// Fastify to acces a UI wbsite to test API
fastify.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'fastify-api',
      version: '1.0.0',
    },
  },
});

fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  exposeRoute: true,
});

//Transcendence routes
fastify.register(require('./routes/users'));
fastify.register(require('./routes/tournament'));

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
});