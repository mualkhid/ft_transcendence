import { recordLocalTournamentResult, completeTournament, getTournament, createTournament } from '../controller/tournamentController.js';
import { resetTournament } from '../services/tournamentService.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function tournamentRoutes(fastify, options) {
  fastify.post('/tournament/create', { preHandler: [authenticate, trackUserActivity] }, createTournament);

  fastify.post('/tournament/local-result', { preHandler: [authenticate, trackUserActivity]}, recordLocalTournamentResult);

  fastify.get('/tournament/:id', { preHandler: [authenticate, trackUserActivity] }, getTournament);

  fastify.patch('/tournament/:id/complete', { preHandler: [authenticate, trackUserActivity] }, completeTournament);

  fastify.delete('/tournament/reset', { preHandler: [authenticate, trackUserActivity] }, async (request, reply) => {
    try {
      const success = await resetTournament();
      return reply.status(200).send({
        success: true,
        message: 'Tournament reset successfully'
      });
    } catch (error) {
      console.error('Error resetting tournament:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to reset tournament'
      });
    }
  });
  
}

export default tournamentRoutes;