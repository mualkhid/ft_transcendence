import tournamentController from '../controller/tournamentController.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function tournamentRoutes(fastify, options) {
  // Create tournament
  fastify.post('/tournament/create', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.createTournament);
  
  // Get active tournaments
  fastify.get('/tournament/active', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.getActiveTournaments);
  
  // Join tournament
  fastify.post('/tournament/join', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.joinTournament);
  
  // Generate bracket
  fastify.post('/tournament/:tournamentId/bracket', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.generateBracket);
  
  // Record match result
  fastify.post('/tournament/match/result', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.recordMatchResult);
  
  // Get tournament bracket
  fastify.get('/tournament/:tournamentId/bracket', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.getTournamentBracket);
  
  // Get next match
  fastify.get('/tournament/:tournamentId/next-match', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.getNextMatch);
  
  // Complete tournament
  fastify.post('/tournament/:tournamentId/complete', { 
    preHandler: [authenticate, trackUserActivity]
  }, tournamentController.completeTournament);
}

export default tournamentRoutes;