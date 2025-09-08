import { 
    addPlayerToMatch, 
    removePlayerFromMatch, 
    getMatch, 
    handlePlayerInput, 
    updateBall 
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
            clearInterval(match.state.gameLoopInterval);
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
            try
            {
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
        console.log(`Player ${playerNumber} disconnected from match ${matchId}`);
        const currentMatch = getMatch(parseInt(matchId));
        if (currentMatch && currentMatch.state.gameFinished)
        {
            console.log(`Game ${matchId} already finished, skipping disconnect message`);
            removePlayerFromMatch(parseInt(matchId), socket);
            return;
        }
        if(currentMatch && !currentMatch.state.gameFinished) {
                const disconnectMessage = JSON.stringify({
                    type: 'opponent-disconnected',
                    message: `Player ${playerNumber} has disconnected`,
                    disconnectedPlayer: playerNumber
                });
                
                if (currentMatch.player1 && currentMatch.player1.readyState === 1)
                    currentMatch.player1.send(disconnectMessage);
                if (currentMatch.player2 && currentMatch.player2.readyState === 1)
                    currentMatch.player2.send(disconnectMessage);
            }
            setTimeout(() => {
                removePlayerFromMatch(parseInt(matchId), socket);
            }, 1000);
        });
}

function handlePlayerInputMessage(socket, data, matchId, playerNumber)
{
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
    
    if (inputResult) {
        // Broadcast input update to both players
        const inputMessage = JSON.stringify({
            type: 'input-update',
            playerNumber: inputResult.playerNumber,
            inputType: inputResult.inputType,
            key: inputResult.inputState,
            inputStates: inputResult.currentKeys,
        });
        
        // Send to both players so they can update their display
        const currentMatch = getMatch(matchId);
        if (currentMatch) {
            if (currentMatch.player1 && currentMatch.player1.readyState === 1)
                currentMatch.player1.send(inputMessage);
            if (currentMatch.player2 && currentMatch.player2.readyState === 1)
                currentMatch.player2.send(inputMessage);
        }
    }
}

function startGameCountdown(match, matchId)
{
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
        const countdownMessage = JSON.stringify({
            type: 'countdown',
            count: countdown,
            message: `Game starting in ${countdown}...`,
            player1Username: match.state.player1Alias,
            player2Username: match.state.player2Alias
        });
        
        // Send countdown to both players
        if (match.player1 && match.player1.readyState === 1)
            match.player1.send(countdownMessage);
        if (match.player2 && match.player2.readyState === 1)
            match.player2.send(countdownMessage);
        
        countdown--;
        
        // Countdown finished, start the game
        if (countdown < 0) {
            clearInterval(countdownInterval);
            
            // Send game start message
            const gameStartMessage = JSON.stringify({
                type: 'game-start',
                message: 'Game started! Use arrow keys to move your paddle.',
                player1Username: match.state.player1username,
                player2Username: match.state.player2username
            });
            
            if (match.player1 && match.player1.readyState === 1)
                match.player1.send(gameStartMessage);
            if (match.player2 && match.player2.readyState === 1)
                match.player2.send(gameStartMessage);
            
            // Start the main game loop (runs at ~60 FPS)
            match.state.gameLoopInterval = setInterval(() => {
                updateBall(matchId);
            }, 16); // 16ms = roughly 60 FPS
        }
    }, 1000); // 1 second intervals for countdown
}