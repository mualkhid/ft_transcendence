
export function setupGracefulShutdown(fastify, prisma) {
    // Graceful shutdown handler using async/await
    async function gracefulShutdown(signal) {
        
        try {
            await fastify.close();
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
        await prisma.$disconnect();
    });

}
