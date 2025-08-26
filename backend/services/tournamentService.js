let currentTournament = null;

let tournamentId = 1;

export function createNewTournament(name)
{
    if(!Array.isArray(aliases) || ![4, 8].includes(aliases.length)) {
        throw new Error('Tournament must have exactly 4 or 8 players');
    }

    const uniqueAliases= new Set(aliases.map(alias => alias.trim().toLowerCase()));
    if(uniqueAliases != aliases.length)
    {
        throw new Error('All aliases must be unique');
    }


    const id = tournamentId++;
    const participants = aliases.map((alais, index) => ({
        id: index + 1, 
        alias: alias.trim() 
    }));

    currentTournament = {
    id,
    name: name || 'Tournament',
    maxPlayers: aliases.length,
    status: 'active',
    participantIds: [
        { id: 1, alias: 'Player1' },
        { id: 2, alias: 'Player2' }
    ],
    bracket: [],
    currentRound: 0,
    winner: null
    };

    generateBracket();
    return currentTournament;
}

function generateBracket()
{
    const shuffled = [...currentTournament.participants].sort(() => Math.random() - 0.5);
    
    const firstRound = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        firstRound.push({
            id: (i / 2) + 1, 
            player1: shuffled[i],
            player2: shuffled[i + 1], 
            winner: null, 
            status: 'pending' 
        });
    }
    
    currentTournament.bracket = [firstRound];
    currentTournament.currentRound = 0;
}

export function getCurrentMatch()
{
    if(!currentTournament || !currentTournament.bracket.length)
        return (null);

    const currentRoundMatches = currentTournament.bracket[currentTournament.currentRound];
    if(!currentRoundMatches)
            return (null);
    
    for(let i = 0; i < currentRoundMatches.length; i++)
    {
        if(currentRoundMatches[i].status === 'pending')
        {
            return{
                ...currentRoundMatches[i],
                roundNumber: currentTournament.currentRound + 1,
                matchNumber: i + 1,
                totalMatches: currentRoundMatches.length
            };
        }
    }
    return (null);
}

export function completeMatch(matchId, winnerAlias)
{
    if(!currentTournament)
            return { error: 'No Tournement active'};
    
    const currentRoundMatches = currentTournament.bracket[currentTournament.currentRound];
    const match = currentRoundMatches?.find(m => m.id === matchId);

    if(!match)
        return { error: 'Match not found'};

    if(match.status != 'pending')
        return { error: 'Match alreayd completed'};

    let winner;
    if(match.player1.alias === winnerAlias)
        winner = match.player1;
    else if(match.player2.alias === winnerAlias)
        winner = match.player2;
    else
        winner = null;
    
    if (!winner)
        return { error: 'Invalid winner - must be one of the match players' };
    
    match.winner = winner;
    match.status = 'completed';
    
    const allMatchesComplete = currentRoundMatches.every(m => m.status === 'completed');
    
    if (allMatchesComplete)
        advanceToNextRound();
    
    return { success: true, match: match };

}

function advanceToNextRound()
{
    const currentRoundMatches = currentTournament.bracket[currentTournament.currentRound];
    const winners = currentRoundMatches.map(m => m.winner);
    
    if (winners.length === 1)
    {
        currentTournament.status = 'completed';
        currentTournament.winner = winners[0];
        return;
    }
    
    const nextRound = [];
    for (let i = 0; i < winners.length; i += 2)
    {
        nextRound.push({
            id: (i / 2) + 1,
            player1: winners[i], 
            player2: winners[i + 1],
            winner: null,
            status: 'pending'
        });
    }
    
    currentTournament.bracket.push(nextRound);
    currentTournament.currentRound++;
}

export function getTournament() {
    return currentTournament;
}

export function getTournamentBracket() {
    if (!currentTournament) {
        return null;
    }
    
    return {
        id: currentTournament.id,
        name: currentTournament.name,
        status: currentTournament.status,
        participants: currentTournament.participants,
        bracket: currentTournament.bracket,
        currentRound: currentTournament.currentRound + 1,
        winner: currentTournament.winner
    };
}

export function resetTournament() {
    currentTournament = null;
}