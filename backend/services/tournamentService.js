let currentTournament = null;

let tournamentId = 1;

function createNewTournament(name)
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

function getTournament() {
    return currentTournament;
}

function resetTournament() {
    currentTournament = null;
}

module.exports = {
    currentTournament,
    createNewTournament,
    resetTournament,
    getTournament
};