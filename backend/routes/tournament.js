import {
  createTournament,
  getCurrentMatchRequest,
  completeMatchRequest,
  getTournamentBracketRequest,
  resetTournamentRequest
} from '../controller/tournamentController.js';

import {
  createTournamentSchema,
  completeMatchSchema
} from '../schema/tournamentSchema.js';

import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function tournamentRoutes(fastify, options)
{
  fastify.post('/tournament/create', { schema: createTournamentSchema , preHandler: [authenticate, trackUserActivity]}, createTournament);
  
  fastify.get('/tournament/current-match', { preHandler: [authenticate, trackUserActivity]}, getCurrentMatchRequest);
  
  fastify.post('/tournament/complete-match', { schema: completeMatchSchema, preHandler: [authenticate, trackUserActivity] }, completeMatchRequest);
  
  fastify.get('/tournament/bracket', {preHandler: [authenticate, trackUserActivity]}, getTournamentBracketRequest);
  
  fastify.post('/tournament/reset', {preHandler: [authenticate, trackUserActivity]}, resetTournamentRequest);

}
export default tournamentRoutes;