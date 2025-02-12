const Fastify = require('fastify');
const fastify = Fastify({ logger: true });

fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/helmet'));  // Security headers
fastify.register(require('./routes'));

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});