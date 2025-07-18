const {
    createNewTournament,
    getTournament,
    currentTournament,
    resetTournament
  } = require('../services/tournamentService');
  
  const { users, matches, generateMatchId } = require('../services/userService');

  async function tournamentRoutes(fastify, options)
  {
    fastify.post('/tournament/create', async (request, reply) => {
      const tournament = createNewTournament("Tournament");
  
      return reply.status(201).send({
        ...tournament,
        message: 'Tournament created successfully!'
      });
    });
  
    fastify.get('/tournament', async (request, reply) => {
      const tournament = getTournament();
  
      if (!tournament) {
        return reply.status(404).send({ error: 'No tournament found' });
      }
  
      return reply.send(tournament);
    });
    fastify.post('/tournament/join', async (request, reply) => {
      const { userId } = request.body;
  
      if (!userId || typeof userId !== 'number') {
        return reply.status(400).send({ error: 'Missing or invalid userId' });
      }

      const user = users.get(userId);
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
  
      const tournament = getTournament();
      if (!tournament) {
        return reply.status(404).send({ error: 'No tournament found' });
      }

      if (tournament.status !== 'registration') {
        return reply.status(403).send({ error: 'Tournament is not accepting new players' });
      }

      if (tournament.participantIds.includes(userId)) {
        return reply.status(409).send({ error: 'User already joined' });
      }
  
      tournament.participantIds.push(userId);
  
      return reply.status(200).send({
        message: `${user.alias} joined the tournament.`
      });
    });
    fastify.get('/tournament/next-match', async (request, reply) => {
      const tournament = getTournament();
      if(!tournament)
          return reply.status(404).send({error: 'No tournament'});
      const participants = tournament.participantIds;
      if(!participants)
        return reply.status(404).send({error: 'No participants in tournament'});

      const matchedUsers = new Set();
      for(const match of matches.values())
      {
        matchedUsers.add(match.player1Id);
        matchedUsers.add(match.player2Id);
      }

      const available = participants.filter(id => !matchedUsers.has(id));
      if (available.length < 2)
        return reply.status(400).send({ error: 'Not enough players' });

      const [player1Id, player2Id] = available;
      const matchId = generateMatchId();

      const match = {
        id : matchId,
        tournamentId : tournament.id,
        player1Id,
        player2Id,
        status : 'pending'
      };

      matches.set(matchId, match);
      const player1 = users.get(player1Id);
      const player2 = users.get(player2Id);

      return reply.send({
        matchId,
        player1: {id : player1Id, alias : player1.alias},
        player2: {id : player2Id, alias : player2.alias},
      });

    });
    fastify.post('/tournament/reset', async (request, reply) => {
      resetTournament();
      matches.clear();
      return reply.status(200).send({message: 'Tournament and matches reset successfully.'});
    });
  }
  
  module.exports = tournamentRoutes;