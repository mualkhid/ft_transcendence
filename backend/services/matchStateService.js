const activeMatches = new Map();

export function createMatchState(matchId){
    if(!activeMatches.has(matchId)){
        activeMatches.set(matchId, {
            player1: null,
            player2: null,
            state: {
                status: 'waiting',
                connectedPlayers: 0
            }
        });
    }
    return activeMatches.get(matchId);
}

export function addPlayerToMatch(matchId, websocket){
    const match = createMatchState(matchId);

    if(!match.player1)
    {
        match.player1 = websocket;
        match.state.connectedPlayers++;
        return (1);
    }
    if(!match.player2)
    {
        match.player2 = websocket;
        match.state.connectedPlayers++;
        return (2);
    }
    return (null);
}

export function removePlayerFromMatch(matchId, websocket)
{
    const match = activeMatches.get(matchId);
    if(!match)
        return (null);
    if(match.player1 === websocket)
    {
        match.player1 = null;
        match.state.connectedPlayers--;
    }
    else if(match.player2 === websocket)
    {
        match.player2 = null;
        match.state.connectedPlayers--;
    }
    if(match.state.connectedPlayers === 0)
    {
        activeMatches.delete(matchId);
    }
}

export function getMatch(matchId)
{
    if(activeMatches.get(matchId))
        return(activeMatches.get(matchId));
    return (null);
}
