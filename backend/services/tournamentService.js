let currentTournament = null;

let tournamentId = 1;

export function createNewTournament(name)
{
    const id = tournamentId++;
    currentTournament = {
    id,
    name,
    status: 'registration',
    participantIds: []
    };
  return currentTournament;
}

export function getTournament() {
    return currentTournament;
}

export function resetTournament() {
    currentTournament = null;
}

export { currentTournament };