import { handleAIGame, saveAIGameResult, getAIGameHistory } from '../controller/aiGameController.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function aiGameRoutes(fastify, options) {
    // AI Game WebSocket endpoint
    fastify.get('/ai-game', { websocket: true }, async (connection, request) => {
        await handleAIGame(connection, request);
    });

    // Save AI game result
    fastify.post('/ai-game/result', { 
        preHandler: [authenticate, trackUserActivity] 
    }, async (request, reply) => {
        try {
            const { playerScore, aiScore, gameType = 'pong-ai' } = request.body;
            
            if (typeof playerScore !== 'number' || typeof aiScore !== 'number') {
                return reply.status(400).send({ error: 'Invalid scores' });
            }

            const result = await saveAIGameResult(request.user.id, playerScore, aiScore, gameType);
            
            return reply.status(200).send({
                success: true,
                message: 'Game result saved',
                result
            });
        } catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    });

    // Get AI game history
    fastify.get('/ai-game/history', { 
        preHandler: [authenticate, trackUserActivity] 
    }, async (request, reply) => {
        try {
            const { gameType = 'pong-ai', limit = 10 } = request.query;
            
            const history = await getAIGameHistory(request.user.id, gameType, parseInt(limit));
            
            return reply.status(200).send({
                success: true,
                history
            });
        } catch (error) {
            return reply.status(500).send({ error: error.message });
        }
    });
}

export default aiGameRoutes;
