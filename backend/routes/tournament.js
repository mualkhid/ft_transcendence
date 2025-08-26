import {
  createTournament,
  getCurrentMatchRequest,
  completeMatchRequest,
  getTournamentBracketRequest,
  resetTournamentRequest
} from '../controller/tournamentController.js';

import {
  createTournamentSchema,
  getCurrentMatchSchema,
  completeMatchSchema,
  getBracketSchema
} from '../schema/tournamentSchema.js';

async function tournamentRoutes(fastify, options)
{
  fastify.post('/tournament/create', { schema: createTournamentSchema }, createTournament);

  fastify.get('/tournament/current-match', { schema: getCurrentMatchSchema }, getCurrentMatchRequest);

  fastify.post('/tournament/complete-match', { schema: completeMatchSchema }, completeMatchRequest);

  fastify.get('/tournament/bracket', { schema: getBracketSchema }, getTournamentBracketRequest);
  
  fastify.post('/tournament/reset', resetTournamentRequest);
}
  
export default tournamentRoutes;