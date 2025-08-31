import {
  createNewTournament,
    getTournament,
    getCurrentMatch,
    completeMatch,
    getTournamentBracket,
    resetTournament
} from '../services/tournamentService.js';

export async function createTournament(request, reply)
{
  try {
      const { name = 'Tournament', aliases } = request.body;
      if (!aliases || !Array.isArray(aliases) || aliases.length === 0)
          return reply.status(400).send({ error: 'Aliases array is required' });

      if (![4, 8].includes(aliases.length))
          return reply.status(400).send({ error: 'Tournament must have exactly 4 or 8 players' });

      const creatorId = request.user?.id || null;

      const tournament = await createNewTournament(name, aliases, creatorId);

      return reply.status(201).send({
          ...tournament,
          message: `Tournament created with ${aliases.length} players! Ready to start.`
      });
    }
    catch (error)
    {
      return reply.status(400).send({ error: error.message });
    }
}
export async function getCurrentMatchRequest(request, reply)
{
    try {
        const tournamentId = request.query.tournamentId ? parseInt(request.query.tournamentId) : null;
        
        const match = await getCurrentMatch(tournamentId);
        
        if (!match) {
            const tournament = await getTournament(tournamentId);
            
            if (!tournament)
                return reply.status(404).send({ error: 'No tournament found' });

            if (tournament.status === 'finished')
            {
                return reply.status(200).send({
                    message: 'Tournament completed',
                    status: 'completed',
                    winner: tournament.winner,
                    tournament: {
                        id: tournament.id,
                        name: tournament.name,
                        status: tournament.status
                    }
                });
            }

            return reply.status(404).send({ 
                error: 'No current match',
                tournament: {
                    id: tournament.id,
                    name: tournament.name,
                    status: tournament.status
                }
            });
        }

        return reply.status(200).send({
            message: `Round ${match.roundNumber}, Match ${match.matchNumber} of ${match.totalMatches}`,
            match: {
                id: match.id,
                player1: match.player1.alias,
                player2: match.player2.alias,
                round: match.roundNumber,
                matchNumber: match.matchNumber,
                totalMatches: match.totalMatches,
                status: match.status,
                tournamentId: match.tournamentId
            }
        });
    } catch (error) {
        console.error('Get current match error:', error);
        return reply.status(500).send({ error: 'Failed to get current match' });
    }
}

export async function completeMatchRequest(request, reply)
{
    try {
        const { matchId, winner } = request.body;
        
        if (!matchId || !winner)
            return reply.status(400).send({ error: 'Match ID and winner are required' });

        const result = await completeMatch(matchId, winner);
        
        if (result.error)
            return reply.status(400).send({ error: result.error });

        const tournament = await getTournament();
        
        let message = `Match completed! ${winner} wins!`;
    
        if (tournament.status === 'finished')
            message += ` 🏆 Tournament winner: ${tournament.winner.alias}!`;
        else
        {
            const nextMatch = await getCurrentMatch();
            if (nextMatch)
                message += ` Next match: ${nextMatch.player1.alias} vs ${nextMatch.player2.alias}`;
        }

        return reply.status(200).send({
            success: true,
            message,
            match: {
                id: result.match.id,
                winner: winner,
                status: 'completed'
            },
            tournament: {
                id: tournament.id,
                name: tournament.name,
                status: tournament.status,
                winner: tournament.winner
            }
        });
    }
    catch (error)
    {
        console.error('Complete match error:', error);
        return reply.status(500).send({ error: 'Failed to complete match' });
    }
}

export async function getTournamentBracketRequest(request, reply)
{
    try {
        const tournamentId = request.query.tournamentId ? parseInt(request.query.tournamentId) : null;
        
        const bracket = await getTournamentBracket(tournamentId);
        
        if (!bracket)
            return reply.status(404).send({ error: 'No tournament found' });

        return reply.status(200).send(bracket);
    }
    catch (error)
    {
        console.error('Get tournament bracket error:', error);
        return reply.status(500).send({ error: 'Failed to get tournament bracket' });
    }
}

export async function resetTournamentRequest(request, reply)
{
    try {
        const tournamentId = request.body?.tournamentId || null;
        
        await resetTournament(tournamentId);
        
        const message = tournamentId ? `Tournament ${tournamentId} reset successfully.`
            : 'All tournaments reset successfully.';
            
        return reply.status(200).send({ 
            success: true,
            message 
        });
    }
    catch (error)
    {
        console.error('Reset tournament error:', error);
        return reply.status(500).send({ error: 'Failed to reset tournament' });
    }
}
