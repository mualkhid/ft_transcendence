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

async function tournamentRoutes(fastify, options)
{
  fastify.post('/tournament/create', { schema: createTournamentSchema }, createTournament);
  
  fastify.get('/tournament/current-match', getCurrentMatchRequest);
  
  fastify.post('/tournament/complete-match', { schema: completeMatchSchema }, completeMatchRequest);
  
  fastify.get('/tournament/bracket', getTournamentBracketRequest);
  
  fastify.post('/tournament/reset', resetTournamentRequest);

}
export default tournamentRoutes;