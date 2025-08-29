
export function setupGracefulShutdown(fastify, prisma) {
    // Graceful shutdown handler using async/await
    async function gracefulShutdown(signal) {
        console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
        
        try {
            await fastify.close();
            console.log('Server closed successfully');
            process.exit(0);
        } catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    }

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C

    // Register onClose hook for Prisma cleanup
    fastify.addHook('onClose', async (instance) => {
        console.log('Closing database connections...');
        await prisma.$disconnect();
        console.log('Database disconnected');
    });

    console.log('Graceful shutdown handlers registered');
}
