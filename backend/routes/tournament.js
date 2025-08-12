const { createTournament, getTournamentRequest, joinTournament, nextMatch, resetTournamentRequest } = require('../controller/tournamentController');
const { createTournamentSchema, getTournamentSchema, joinTournamentSchema, nextMatchSchema, resetTournamentSchema  } = require('../schema/tournamentSchema');


  async function tournamentRoutes(fastify, options)
  {
    fastify.post('/tournament/create', {schema: createTournamentSchema}, createTournament);
  
    fastify.get('/tournament', {schema: getTournamentSchema}, getTournamentRequest);

    fastify.post('/tournament/join', {schema: joinTournamentSchema}, joinTournament);

    fastify.get('/tournament/next-match', {schema : nextMatchSchema}, nextMatch);

    fastify.post('/tournament/reset', {schema: resetTournamentSchema}, resetTournamentRequest);
    
  }
  
  module.exports = tournamentRoutes;