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
      const cleanAliases = aliases.map(alias => {
          if (typeof alias !== 'string' || alias.trim().length === 0) {
              throw new Error('All aliases must be non-empty strings');
          }
          return alias.trim();
      });
      const tournament = createNewTournament(name, cleanAliases);
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
  const match = getCurrentMatch();
  if (!match)
  {
      const tournament = getTournament();
      if (!tournament) {
          return reply.status(404).send({ error: 'No tournament found' });
      }
      if (tournament.status === 'completed') {
          return reply.status(200).send({
              message: 'Tournament completed',
              status: 'completed',
              winner: tournament.winner,
              bracket: getTournamentBracket()
          });
      }
      return reply.status(404).send({ error: 'No current match' });
  }
  return reply.status(200).send({
      message: `Round ${match.roundNumber}, Match ${match.matchNumber}`,
      match: {
          id: match.id,
          player1: match.player1.alias,
          player2: match.player2.alias,
          round: match.roundNumber,
          status: match.status
      }
  });
}
export async function completeMatchRequest(request, reply)
{
    const { matchId, winner } = request.body;
    if (!matchId || !winner)
        return reply.status(400).send({ error: 'Match ID and winner are required' });
    const result = completeMatch(matchId, winner);
    if (result.error)
        return reply.status(400).send({ error: result.error });
    const tournament = getTournament();
    let message = `Match completed! ${winner} wins!`;
    if (tournament.status === 'completed')
        message += ` Tournament winner: ${tournament.winner.alias}!`;
    else
    {
        const nextMatch = getCurrentMatch();
        if (nextMatch)
            message += ` Next: ${nextMatch.player1.alias} vs ${nextMatch.player2.alias}`;
    }
    return reply.status(200).send({
        message,
        tournamentStatus: tournament.status,
        winner: tournament.winner
    });
}
export async function getTournamentBracketRequest(request, reply)
{
  const bracket = getTournamentBracket();
  if (!bracket)
      return reply.status(404).send({ error: 'No tournament found' });
  return reply.status(200).send(bracket);
}
export async function resetTournamentRequest(request, reply)
{
  resetTournament();
  return reply.status(200).send({message: 'Tournament and matches reset successfully.'});
}

