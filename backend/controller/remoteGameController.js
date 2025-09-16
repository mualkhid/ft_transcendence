import { 
    addPlayerToMatch, 
    removePlayerFromMatch, 
    getMatch, 
    handlePlayerInput, 
    updateBall,
    updateDashboardStats
} from '../services/matchStateService.js';

export async function handleRemoteGame(socket, matchId, username = null)
{
    if (!socket)
    {
        console.error('No WebSocket connection provided');
        return;
    }
    
    const playerNumber = await addPlayerToMatch(parseInt(matchId), socket, username);

    if (playerNumber === null) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Match is full - maximum 2 players allowed'
        }));
        socket.close(1000, 'Match is full');
        return;
    }
    
    const match = getMatch(parseInt(matchId));
    if (!match) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to initialize match - please try again'
        }));
        socket.close(1011, 'Match initialization failed');
        return;
    }
    
    const successMessage = JSON.stringify({
        type: 'success',
        playerNumber: playerNumber,
        message: `Connected successfully as Player ${playerNumber}`,
        player1Username: match.state.player1Username || 'Player 1',
        player2Username: match.state.player2Username || 'Player 2'
    });
    socket.send(successMessage);

    if (match.state.connectedPlayers === 2)
    {
        const readyMessage = JSON.stringify({
            type: 'ready',
            message: 'Both players connected! Starting countdown...',
            player1Username: match.state.player1Username,
            player2Username: match.state.player2Username
        });
        
        if (match.player1 && match.player1.readyState === 1)
            match.player1.send(readyMessage);
        if (match.player2 && match.player2.readyState === 1)
            match.player2.send(readyMessage);
        if (match.state.gameLoopInterval)
        {
            clearInterval(match.state.gameLoopInterval);
            match.state.gameLoopInterval = null;
        }
            
        startGameCountdown(match, parseInt(matchId));
            
    }
    else
    {
        const waitingMessage = JSON.stringify({
            type: 'waiting',
            message: `Waiting for opponent to join... (${match.state.connectedPlayers}/2 players)`,
            connectedPlayers: match.state.connectedPlayers
        });
        socket.send(waitingMessage);
    }

    socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'input')
                handlePlayerInputMessage(socket, data, parseInt(matchId), playerNumber);
        } catch (error) {
            console.error('Error parsing message from client:', error);
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    socket.removeAllListeners('close');
    socket.on('close', async (code, reason) => { 
        const currentMatch = getMatch(parseInt(matchId));
        if (!currentMatch)
            return;
        if (!currentMatch.state.gameFinished && currentMatch.state.gameLoopInterval)
        {
            clearInterval(currentMatch.state.gameLoopInterval);
            currentMatch.state.gameLoopInterval = null;
        }
        await removePlayerFromMatch(parseInt(matchId), socket);
    });
}

function handlePlayerInputMessage(socket, data, matchId, playerNumber)
{
    const currentMatch = getMatch(matchId);
    if (!currentMatch)
        return;
    
    if (currentMatch.state.gameFinished)
         return;
    
    // Validate input type
    if (!['keydown', 'keyup'].includes(data.inputType))
    {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid inputType. Use "keydown" or "keyup"'
        }));
        return;
    }
    
    // Validate key
    if (!['down', 'up'].includes(data.key)) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid key. Use "up" or "down"'
        }));
        return;
    }
    
    const inputResult = handlePlayerInput(matchId, playerNumber, data.inputType, data.key);
    
    if (inputResult)
    {
        // Broadcast input update to both players
        const inputMessage = JSON.stringify({
            type: 'input-update',
            playerNumber: inputResult.playerNumber,
            inputType: inputResult.inputType,
            key: inputResult.inputState,
            inputStates: inputResult.currentKeys,
        });
        
        // Send to both players so they can update their display
        const currentMatchForBroadcast = getMatch(matchId);
        if (currentMatchForBroadcast && !currentMatchForBroadcast.state.gameFinished) {
            if (currentMatchForBroadcast.player1 && currentMatchForBroadcast.player1.readyState === 1)
                currentMatchForBroadcast.player1.send(inputMessage);
            if (currentMatchForBroadcast.player2 && currentMatchForBroadcast.player2.readyState === 1)
                currentMatchForBroadcast.player2.send(inputMessage);
        }
    }
}

function startGameCountdown(match, matchId)
{
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
        const currentMatch = getMatch(matchId);
        if (!currentMatch || currentMatch.state.gameFinished)
        {
            clearInterval(countdownInterval);
            return;
        }
        
        const countdownMessage = JSON.stringify({
            type: 'countdown',
            count: countdown,
            message: `Game starting in ${countdown}...`,
            player1Username: match.state.player1Username,
            player2Username: match.state.player2Username
        });
        
        // Send countdown to both players
        if (match.player1 && match.player1.readyState === 1)
            match.player1.send(countdownMessage);
        if (match.player2 && match.player2.readyState === 1)
            match.player2.send(countdownMessage);
        
        countdown--;
        
        if (countdown < 0)
        {
            clearInterval(countdownInterval);
            const finalMatch = getMatch(matchId);
            if (!finalMatch || finalMatch.state.gameFinished || finalMatch.state.connectedPlayers < 2)
                return;
            
            // Send game start message
            const gameStartMessage = JSON.stringify({
                type: 'game-start',
                message: 'Game started! Use arrow keys to move your paddle.',
                player1Username: match.state.player1Username,
                player2Username: match.state.player2Username
            });
            
            if (match.player1 && match.player1.readyState === 1)
                match.player1.send(gameStartMessage);
            if (match.player2 && match.player2.readyState === 1)
                match.player2.send(gameStartMessage);
            
            match.state.gameLoopInterval = setInterval(() => {
                const activeMatch = getMatch(matchId);
                if (!activeMatch || activeMatch.state.gameFinished || activeMatch.state.connectedPlayers < 2)
                {
                    if (activeMatch && activeMatch.state.gameLoopInterval)
                    {
                        clearInterval(activeMatch.state.gameLoopInterval);
                        activeMatch.state.gameLoopInterval = null;
                        if (activeMatch)
                            activeMatch.state.gameFinished = true;
                    }
                    return;
                }
                
                updateBall(matchId);
            }, 16); // 16ms = roughly 60 FPS
        }
    }, 1000); // 1 second intervals for countdown
}