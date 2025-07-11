const fastify = require('fastify')();

fastify.register(require('./routes/users'));
fastify.register(require('./routes/tournament'));

fastify.get('/ping', function (request, reply) {
  reply.send({msg : 'pong'})
})

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})