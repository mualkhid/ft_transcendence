import { createTournament, getTournamentRequest, joinTournament, nextMatch, resetTournamentRequest } from '../controller/tournamentController.js';
import { createTournamentSchema, getTournamentSchema, joinTournamentSchema, nextMatchSchema, resetTournamentSchema  } from '../schema/tournamentSchema.js';


async function tournamentRoutes(fastify, options)
{
  fastify.post('/tournament/create', {schema: createTournamentSchema}, createTournament);

  fastify.get('/tournament', {schema: getTournamentSchema}, getTournamentRequest);

  fastify.post('/tournament/join', {schema: joinTournamentSchema}, joinTournament);

  fastify.get('/tournament/next-match', {schema : nextMatchSchema}, nextMatch);

  fastify.post('/tournament/reset', {schema: resetTournamentSchema}, resetTournamentRequest);

}
  
export default tournamentRoutes;