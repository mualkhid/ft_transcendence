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
            console.log(`Clearing existing game loop for match ${matchId}`);
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
            else if (data.type === 'leave') {
            console.log(`Player ${playerNumber} voluntarily left match ${matchId}: ${data.reason}`);
            handlePlayerLeave(socket, parseInt(matchId), playerNumber, data.reason || 'voluntarily_left');
        }
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
        console.log(`Player ${playerNumber} disconnected from match ${matchId} - Code: ${code}, Reason: ${reason}`);
        
        const currentMatch = getMatch(parseInt(matchId));
        if (!currentMatch) {
            console.log(`Match ${matchId} not found during disconnect - likely already cleaned up`);
            return;
        }
        
        // CRITICAL FIX: Stop game loop immediately on ANY disconnect during active game
        if (!currentMatch.state.gameFinished && currentMatch.state.gameLoopInterval) {
            console.log(`EMERGENCY STOP: Clearing game loop immediately for match ${matchId}`);
            clearInterval(currentMatch.state.gameLoopInterval);
            currentMatch.state.gameLoopInterval = null;
            const remainingPlayer = playerNumber === 1 ? currentMatch.player2 : currentMatch.player1;
        if (remainingPlayer && remainingPlayer !== socket && remainingPlayer.readyState === 1) {
            const disconnectMessage = JSON.stringify({
                type: 'opponent-disconnected',
                message: `Player ${playerNumber} disconnected unexpectedly`,
                disconnectedPlayer: playerNumber,
                reason: 'unexpected_disconnect'
            });
            remainingPlayer.send(disconnectMessage);
            console.log('Sent opponent-disconnected message to remaining player.');
        }
            await removePlayerFromMatch(parseInt(matchId), socket);
        }
        
        console.log(`Match state: gameFinished=${currentMatch.state.gameFinished}, connectedPlayers=${currentMatch.state.connectedPlayers}`);
        
        // Handle different closure scenarios
        if (code === 1000) {
            // Normal closure
            const normalReasons = ['Game completed normally', 'Match is full', 'User chose to go home'];
            if (normalReasons.some(normalReason => reason && reason.includes(normalReason))) {
                console.log(`Normal closure for match ${matchId}: ${reason}`);
                await removePlayerFromMatch(parseInt(matchId), socket);
                return;
            }
        }
        
        // Handle page refresh/navigation (code 1001)
        if (code === 1001) {
            console.log(`Page navigation disconnect for match ${matchId}`);
            // For page refreshes during active games, treat as unexpected disconnect
            if (!currentMatch.state.gameFinished) {
                console.log(`Treating page refresh as unexpected disconnect during active game`);
                
                // ADDITIONAL SAFETY: Stop game loop again
                if (currentMatch.state.gameLoopInterval) {
                    console.log(`SAFETY STOP: Clearing game loop for page refresh`);
                    clearInterval(currentMatch.state.gameLoopInterval);
                    currentMatch.state.gameLoopInterval = null;
                }
                
                // Send notification to remaining player before cleanup
                const disconnectMessage = JSON.stringify({
                    type: 'opponent-disconnected',
                    message: `Player ${playerNumber} disconnected (page refresh/navigation)`,
                    disconnectedPlayer: playerNumber,
                    reason: 'page_navigation'
                });
                
                // Send to remaining connected player
                const remainingPlayer = playerNumber === 1 ? currentMatch.player2 : currentMatch.player1;
                if (remainingPlayer && remainingPlayer !== socket && remainingPlayer.readyState === 1) {
                    remainingPlayer.send(disconnectMessage);
                }
            }
            await removePlayerFromMatch(parseInt(matchId), socket);
            return;
        }
        
        // Handle server errors (1002, 1008, 1011)
        if ([1002, 1008, 1011].includes(code)) {
            console.log(`Server error closure for match ${matchId}: ${reason}`);
            // ADDITIONAL SAFETY: Stop game loop for server errors
            if (currentMatch.state.gameLoopInterval) {
                console.log(`SAFETY STOP: Clearing game loop for server error`);
                clearInterval(currentMatch.state.gameLoopInterval);
                currentMatch.state.gameLoopInterval = null;
            }
            await removePlayerFromMatch(parseInt(matchId), socket);
            return;
        }
        
        // All other cases - treat as unexpected disconnect
        console.log(`Unexpected disconnect in match ${matchId} - Code: ${code}`);
        
        // CRITICAL: Stop game loop for unexpected disconnects
        if (currentMatch.state.gameLoopInterval) {
            console.log(`SAFETY STOP: Clearing game loop for unexpected disconnect`);
            clearInterval(currentMatch.state.gameLoopInterval);
            currentMatch.state.gameLoopInterval = null;
        }
        
        // Only send notification if game is still active
        if (!currentMatch.state.gameFinished) {
            const disconnectMessage = JSON.stringify({
                type: 'opponent-disconnected',
                message: `Player ${playerNumber} has disconnected unexpectedly`,
                disconnectedPlayer: playerNumber,
                reason: 'unexpected_disconnect'
            });
            
            // Send to remaining connected player
            const remainingPlayer = playerNumber === 1 ? currentMatch.player2 : currentMatch.player1;
            if (remainingPlayer && remainingPlayer !== socket && remainingPlayer.readyState === 1) {
                remainingPlayer.send(disconnectMessage);
            }
        }
        
        // Clean up the disconnected player
        await removePlayerFromMatch(parseInt(matchId), socket);
    });
}

function handlePlayerInputMessage(socket, data, matchId, playerNumber)
{
    // SAFETY CHECK: Get current match and verify it's still active
    const currentMatch = getMatch(matchId);
    if (!currentMatch) {
        console.log(`Match ${matchId} not found, ignoring input`);
        return;
    }
    
    if (currentMatch.state.gameFinished) {
        console.log(`Game ${matchId} is finished, ignoring input from player ${playerNumber}`);
        return;
    }
    
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
        // SAFETY CHECK: Verify match is still active
        const currentMatch = getMatch(matchId);
        if (!currentMatch || currentMatch.state.gameFinished) {
            console.log(`Match ${matchId} no longer active, stopping countdown`);
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
        
        // Countdown finished, start the game
        if (countdown < 0) {
            clearInterval(countdownInterval);
            
            // FINAL SAFETY CHECK before starting game loop
            const finalMatch = getMatch(matchId);
            if (!finalMatch || finalMatch.state.gameFinished || finalMatch.state.connectedPlayers < 2) {
                console.log(`Cannot start game for match ${matchId}: match invalid or not enough players`);
                return;
            }
            
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
            
            // Start the main game loop with additional safety checks
            console.log(`Starting game loop for match ${matchId}`);
            match.state.gameLoopInterval = setInterval(() => {
                // CRITICAL: Check if game should still be running before each update
                const activeMatch = getMatch(matchId);
                if (!activeMatch || activeMatch.state.gameFinished || activeMatch.state.connectedPlayers < 2) {
                    console.log(`Game loop stopping for match ${matchId}: invalid state`);
                    if (activeMatch && activeMatch.state.gameLoopInterval) {
                        clearInterval(activeMatch.state.gameLoopInterval);
                        activeMatch.state.gameLoopInterval = null;
                        if (activeMatch) activeMatch.state.gameFinished = true;
                    }
                    return;
                }
                
                updateBall(matchId);
            }, 16); // 16ms = roughly 60 FPS
            
            console.log(`Game loop started for match ${matchId} with interval ID:`, match.state.gameLoopInterval);
        }
    }, 1000); // 1 second intervals for countdown
}

async function handlePlayerLeave(socket, matchId, playerNumber, reason) {
    const match = getMatch(matchId);
    if (!match) {
        console.log(`Match ${matchId} not found for leave handling`);
        return;
    }

    // If game is already finished, just clean up
    if (match.state.gameFinished) {
        console.log(`Game ${matchId} already finished, just cleaning up player ${playerNumber}`);
        await removePlayerFromMatch(matchId, socket);
        return;
    }

    // Stop the game immediately
    if (match.state.gameLoopInterval) {
        clearInterval(match.state.gameLoopInterval);
        match.state.gameLoopInterval = null;
    }
    match.state.gameFinished = true;

    // Determine winner (the player who didn't leave)
    const remainingPlayerNumber = playerNumber === 1 ? 2 : 1;
    const leavingPlayerUsername = playerNumber === 1 ? match.state.player1Username : match.state.player2Username;
    const remainingPlayerUsername = playerNumber === 1 ? match.state.player2Username : match.state.player1Username;
    
    // Update database stats
    try {
        await updateDashboardStats(
            match.state.player1Username,
            match.state.player2Username,
            remainingPlayerUsername // Winner is the one who stayed
        );
    } catch (error) {
        console.error(`Failed to update dashboard stats: ${error.message}`);
    }

    // Send game-abandoned message to remaining player
    const remainingPlayer = playerNumber === 1 ? match.player2 : match.player1;
    if (remainingPlayer && remainingPlayer.readyState === 1) {
        const abandonMessage = {
            type: 'game-abandoned',
            message: `${leavingPlayerUsername} left the game. You win!`,
            winner: remainingPlayerNumber,
            winnerAlias: remainingPlayerUsername,
            player1Username: match.state.player1Username,
            player2Username: match.state.player2Username,
            player1Score: match.state.scorePlayer1,
            player2Score: match.state.scorePlayer2,
            reason: 'opponent_left'
        };
        remainingPlayer.send(JSON.stringify(abandonMessage));
        console.log(`Sent win-by-leave message to ${remainingPlayerUsername}`);
    }

    // Update match in database
    if (match.matchId) {
        try {
            await completeMatch(
                match.matchId,
                remainingPlayerUsername,
                match.state.scorePlayer1,
                match.state.scorePlayer2
            );
        } catch (error) {
            console.error(`Failed to complete match in DB: ${error.message}`);
        }
    }

    // Clean up the player who left
    await removePlayerFromMatch(matchId, socket);
    
    // Close the socket with a specific reason
    socket.close(1000, 'Player voluntarily left the game');
}