import { recordLocalTournamentResult, completeTournament, getTournament, createTournament } from '../controller/tournamentController.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function tournamentRoutes(fastify, options) {
  fastify.post('/tournament/create', { preHandler: [authenticate, trackUserActivity] }, createTournament);

  fastify.post('/tournament/local-result', { preHandler: [authenticate, trackUserActivity]}, recordLocalTournamentResult);

  fastify.get('/tournament/:id', { preHandler: [authenticate, trackUserActivity] }, getTournament);

  fastify.patch('/tournament/:id/complete', { preHandler: [authenticate, trackUserActivity] }, completeTournament);
  
}

export default tournamentRoutes;