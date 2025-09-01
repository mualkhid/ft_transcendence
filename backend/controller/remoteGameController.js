import { addPlayerToMatch, removePlayerFromMatch, getMatch, handlePlayerInput, updateBall} from '../services/matchStateService.js';

export async function handleRemoteGame(socket, matchId)
{
    const playerNumber = await addPlayerToMatch(parseInt(matchId), socket);

    if (playerNumber === null)
    {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Match is full'
        }));
        socket.close(1000, 'Match is full');
        return;
    }
    
    const successMessage = JSON.stringify({
        type: 'success',
        playerNumber: playerNumber,
        message: `You are player ${playerNumber}`,
        player1Username: match.state.player1Alias,
        player2Username: match.state.player2Alias
    });
    
    socket.send(successMessage);

    const match = getMatch(parseInt(matchId));
    if (!match)
    {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to initialize match'
        }));
        socket.close(1011, 'Match initialization failed');
        return;
    }

    if (match.state.connectedPlayers === 2)
    {
        const readyMessage = JSON.stringify({
            type: 'ready',
            message: 'Both players connected! Match ready to start.',
            player1Username: match.state.player1Alias,
            player2Username: match.state.player2Alias
        });
        
        
        if (match.player1)
            match.player1.send(readyMessage);
        if (match.player2)
            match.player2.send(readyMessage);
        
        if (match.state.gameLoopInterval) {
            clearInterval(match.state.gameLoopInterval);
        }
        match.state.gameLoopInterval = setInterval(() => updateBall(parseInt(matchId)), 16);
    }

    socket.on('message', (message) => {
            const data = JSON.parse(message);
            
            if (data.type === 'input') {
                if (!['keydown', 'keyup'].includes(data.inputType)) {
                    socket.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid inputType. Use "keydown" or "keyup".'
                    }));
                    return;
                }
                
                if (!['down', 'up'].includes(data.key)) {
                    socket.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid key. Use "up" or "down".'
                    }));
                    return;
                }
                
                const inputResult = handlePlayerInput(
                    parseInt(matchId),
                    playerNumber,
                    data.inputType,
                    data.key
                );
                
                if (inputResult) {
                    const inputMessage = JSON.stringify({
                        type: 'input-update',
                        playerNumber: inputResult.playerNumber,
                        inputType: inputResult.inputType,
                        key: inputResult.inputState,
                        inputStates: inputResult.currentKeys,
                    });
                    
                    const currentMatch = getMatch(parseInt(matchId));
                    if (currentMatch) {
                        if (currentMatch.player1) currentMatch.player1.send(inputMessage);
                        if (currentMatch.player2) currentMatch.player2.send(inputMessage);
                    }
                }
            } else if (data.type === 'ping') {
                socket.send(JSON.stringify({
                    type: 'pong',
                    timestamp: data.timestamp,
                    serverTime: Date.now()
                }));
            }
        });
        socket.removeAllListeners('close');
        socket.on('close', async (code, reason) => {
            await removePlayerFromMatch(parseInt(matchId), socket);
                const remainingMatch = getMatch(parseInt(matchId));
                
                if (remainingMatch)
                {
                    const disconnectMessage = JSON.stringify({
                        type: 'disconnect',
                        message: `Player ${playerNumber} has disconnected`
                    });
                    
                    if (remainingMatch.player1) remainingMatch.player1.send(disconnectMessage);
                    if (remainingMatch.player2) remainingMatch.player2.send(disconnectMessage);
                }
        });
}