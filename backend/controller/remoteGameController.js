import { addPlayerToMatch, removePlayerFromMatch, getMatch, handlePlayerInput, updateBall} from '../services/matchStateService.js';

// Store connected players for the simple remote game implementation
const connectedPlayers = new Map();
const gameStates = new Map();
const playAgainRequests = new Map();

// Initialize game state for a match
function initializeGameState(matchId) {
    const gameState = {
        ballX: 400,
        ballY: 300,
        ballSpeedX: 5,
        ballSpeedY: 3,
        leftPaddleY: 250,
        rightPaddleY: 250,
        player1Score: 0,
        player2Score: 0,
        gameLoop: null,
        isActive: false
    };
    gameStates.set(matchId, gameState);
    return gameState;
}

// Reset ball to center
function resetBall(gameState) {
    gameState.ballX = 400;
    gameState.ballY = 300;
    gameState.ballSpeedX = Math.random() > 0.5 ? 5 : -5;
    gameState.ballSpeedY = Math.random() > 0.5 ? 3 : -3;
}

// Update dashboard stats via API
async function updateDashboardStats(player1Username, player2Username, winner) {
    try {
        console.log(`📊 Updating dashboard stats for game: ${player1Username} vs ${player2Username}, Winner: ${winner}`);
        
        // Update winner stats
        const winnerResponse = await fetch(`http://localhost:3000/api/users/update-stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: winner,
                gamesPlayed: 1,
                wins: 1,
                losses: 0
            })
        });
        
        // Update loser stats
        const loser = winner === player1Username ? player2Username : player1Username;
        const loserResponse = await fetch(`http://localhost:3000/api/users/update-stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: loser,
                gamesPlayed: 1,
                wins: 0,
                losses: 1
            })
        });
        
        if (winnerResponse.ok && loserResponse.ok) {
            console.log('✅ Dashboard stats updated successfully');
        } else {
            console.log('❌ Failed to update dashboard stats');
        }
    } catch (error) {
        console.error('❌ Error updating dashboard stats:', error);
    }
}

// Update game state and check collisions
function updateGameState(matchId) {
    const gameState = gameStates.get(matchId);
    if (!gameState || !gameState.isActive) return;
    
    // Update ball position
    gameState.ballX += gameState.ballSpeedX;
    gameState.ballY += gameState.ballSpeedY;
    
    // Ball collision with top and bottom walls
    if (gameState.ballY <= 10 || gameState.ballY >= 590) {
        gameState.ballSpeedY = -gameState.ballSpeedY;
    }
    
    // Ball collision with paddles
    const paddleWidth = 15;
    const paddleHeight = 100;
    
    // Left paddle collision
    if (gameState.ballX <= 65 && gameState.ballX >= 50 &&
        gameState.ballY >= gameState.leftPaddleY && 
        gameState.ballY <= gameState.leftPaddleY + paddleHeight) {
        gameState.ballSpeedX = -gameState.ballSpeedX;
        gameState.ballX = 65; // Prevent ball from getting stuck
    }
    
    // Right paddle collision
    if (gameState.ballX >= 735 && gameState.ballX <= 750 &&
        gameState.ballY >= gameState.rightPaddleY && 
        gameState.ballY <= gameState.rightPaddleY + paddleHeight) {
        gameState.ballSpeedX = -gameState.ballSpeedX;
        gameState.ballX = 735; // Prevent ball from getting stuck
    }
    
    // Score points
    if (gameState.ballX <= 0) {
        gameState.player2Score++;
        resetBall(gameState);
    } else if (gameState.ballX >= 800) {
        gameState.player1Score++;
        resetBall(gameState);
    }
    
    // Send updated game state to both players
    const matchPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
    if (matchPlayers.length === 2) {
        const player1Key = matchPlayers[0];
        const player2Key = matchPlayers[1];
        const player1Username = player1Key.split('-')[1];
        const player2Username = player2Key.split('-')[1];
        
        const gameStateMessage = JSON.stringify({
            type: 'game-state',
            ballX: gameState.ballX,
            ballY: gameState.ballY,
            leftPaddleY: gameState.leftPaddleY,
            rightPaddleY: gameState.rightPaddleY,
            player1Score: gameState.player1Score,
            player2Score: gameState.player2Score,
            player1Username: player1Username,
            player2Username: player2Username
        });
        
        matchPlayers.forEach(playerKey => {
            const playerWs = connectedPlayers.get(playerKey);
            if (playerWs && playerWs.readyState === 1) {
                playerWs.send(gameStateMessage);
            }
        });
        
        // Check for game over
        if (gameState.player1Score >= 5 || gameState.player2Score >= 5) {
            const winner = gameState.player1Score >= 5 ? player1Username : player2Username;
            const winnerScore = gameState.player1Score >= 5 ? gameState.player1Score : gameState.player2Score;
            const loserScore = gameState.player1Score >= 5 ? gameState.player2Score : gameState.player1Score;
            
            const gameOverMessage = JSON.stringify({
                type: 'game-over',
                winner: winner,
                winnerScore: winnerScore,
                loserScore: loserScore,
                player1Username: player1Username,
                player2Username: player2Username
            });
            
            // Stop the game loop
            if (gameState.gameLoop) {
                clearInterval(gameState.gameLoop);
                gameState.isActive = false;
            }
            
            // Send game over message to both players
            matchPlayers.forEach(playerKey => {
                const playerWs = connectedPlayers.get(playerKey);
                if (playerWs && playerWs.readyState === 1) {
                    playerWs.send(gameOverMessage);
                }
            });
            
            // Update dashboard stats via API
            updateDashboardStats(player1Username, player2Username, winner);
            
            console.log(`🏆 Game over! ${winner} wins!`);
        }
    }
}

// Start game for the given players
function startGameForPlayers(matchPlayers, matchId) {
    console.log('🎯 Both players connected! Starting game...');
    
    // Get the two players
    const player1Key = matchPlayers[0];
    const player2Key = matchPlayers[1];
    const player1Username = player1Key.split('-')[1];
    const player2Username = player2Key.split('-')[1];
    const player1Number = parseInt(player1Key.split('-')[3]);
    const player2Number = parseInt(player2Key.split('-')[3]);
    
    console.log('👥 Players:', player1Username, '(Player', player1Number, ') vs', player2Username, '(Player', player2Number, ')');
    
    // Send ready message to both players with their player numbers
    const readyMessage1 = JSON.stringify({
        type: 'ready',
        message: 'Both players ready! Game starting...',
        playerNumber: player1Number,
        player1Username: player1Username,
        player2Username: player2Username
    });
    
    const readyMessage2 = JSON.stringify({
        type: 'ready',
        message: 'Both players ready! Game starting...',
        playerNumber: player2Number,
        player1Username: player1Username,
        player2Username: player2Username
    });
    
    const player1Ws = connectedPlayers.get(player1Key);
    const player2Ws = connectedPlayers.get(player2Key);
    
    if (player1Ws && player1Ws.readyState === 1) {
        player1Ws.send(readyMessage1);
    }
    if (player2Ws && player2Ws.readyState === 1) {
        player2Ws.send(readyMessage2);
    }
    
    // Send "Ready to play?" message first
    setTimeout(() => {
        const readyToPlayMessage = JSON.stringify({
            type: 'ready-to-play',
            message: 'Ready to play?',
            player1Username: player1Username,
            player2Username: player2Username
        });
        
        if (player1Ws && player1Ws.readyState === 1) {
            player1Ws.send(readyToPlayMessage);
        }
        if (player2Ws && player2Ws.readyState === 1) {
            player2Ws.send(readyToPlayMessage);
        }
        
        // Start countdown after showing "Ready to play?"
        setTimeout(() => {
            let countdown = 3;
            const countdownInterval = setInterval(() => {
                const countdownMessage = JSON.stringify({
                    type: 'countdown',
                    count: countdown,
                    message: `Game starting in ${countdown}...`,
                    player1Username: player1Username,
                    player2Username: player2Username
                });
                
                if (player1Ws && player1Ws.readyState === 1) {
                    player1Ws.send(countdownMessage);
                }
                if (player2Ws && player2Ws.readyState === 1) {
                    player2Ws.send(countdownMessage);
                }
                
                countdown--;
                
                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    
                    // Start the game
                    const gameStartMessage = JSON.stringify({
                        type: 'game-start',
                        message: 'Game started!',
                        player1Username: player1Username,
                        player2Username: player2Username
                    });
                    
                    if (player1Ws && player1Ws.readyState === 1) {
                        player1Ws.send(gameStartMessage);
                    }
                    if (player2Ws && player2Ws.readyState === 1) {
                        player2Ws.send(gameStartMessage);
                    }
                    
                    // Initialize and start the game loop
                    const gameState = initializeGameState(matchId);
                    gameState.isActive = true;
                    gameState.gameLoop = setInterval(() => {
                        updateGameState(matchId);
                    }, 16); // ~60 FPS
                    
                    console.log('🎮 Game loop started for match', matchId);
                }
            }, 1000);
        }, 2000); // Wait 2 seconds after "Ready to play?" before countdown
    }, 2000); // Wait 2 seconds before showing "Ready to play?"
}

// Handle player input for paddle movement
function handleSimplePlayerInput(matchId, playerNumber, inputType, key) {
    console.log(`🎮 Player ${playerNumber} input: ${inputType} ${key}`);
    
    const gameState = gameStates.get(matchId);
    if (!gameState || !gameState.isActive) return;
    
    const paddleSpeed = 8;
    
    if (inputType === 'keydown') {
        if (playerNumber === 1) {
            // Player 1 controls left paddle
            if (key === 'up' && gameState.leftPaddleY > 0) {
                gameState.leftPaddleY -= paddleSpeed;
            } else if (key === 'down' && gameState.leftPaddleY < 500) {
                gameState.leftPaddleY += paddleSpeed;
            }
        } else if (playerNumber === 2) {
            // Player 2 controls right paddle
            if (key === 'up' && gameState.rightPaddleY > 0) {
                gameState.rightPaddleY -= paddleSpeed;
            } else if (key === 'down' && gameState.rightPaddleY < 500) {
                gameState.rightPaddleY += paddleSpeed;
            }
        }
    }
}

// Handle play again requests
function handlePlayAgainRequest(playerKey, matchId) {
    if (!playAgainRequests.has(matchId)) {
        playAgainRequests.set(matchId, new Set());
    }
    
    const requests = playAgainRequests.get(matchId);
    requests.add(playerKey);
    
    console.log(`Player ${playerKey} wants to play again. Total requests: ${requests.size}`);
    
    // If both players want to play again, restart the game
    if (requests.size === 2) {
        console.log('Both players want to play again! Restarting game...');
        
        // Clear the requests
        playAgainRequests.delete(matchId);
        
        // Find the match players
        const matchPlayers = Array.from(connectedPlayers.keys()).filter(key => key.includes(`match-${matchId}`));
        
        if (matchPlayers.length === 2) {
            // Reset game state and restart
            const gameState = initializeGameState(matchId);
            gameState.isActive = false; // Will be set to true when game starts
            
            // Send restart message to both players
            const restartMessage = JSON.stringify({
                type: 'game-restart',
                message: 'Both players agreed to play again!'
            });
            
            matchPlayers.forEach(playerKey => {
                const playerWs = connectedPlayers.get(playerKey);
                if (playerWs && playerWs.readyState === 1) {
                    playerWs.send(restartMessage);
                }
            });
            
            // Start the game again
            setTimeout(() => {
                startGameForPlayers(matchPlayers, matchId);
            }, 1000);
        }
    } else {
        // Send waiting message to the player who requested
        const waitingMessage = JSON.stringify({
            type: 'play-again-waiting',
            message: 'Waiting for other player to agree...'
        });
        
        const playerWs = connectedPlayers.get(playerKey);
        if (playerWs && playerWs.readyState === 1) {
            playerWs.send(waitingMessage);
        }
    }
}

export async function handleRemoteGame(socket, matchId, username = null) {
    console.log('handleRemoteGame called with:', {
        socket: !!socket,
        socketType: typeof socket,
        matchId: matchId,
        username: username
    });
    
    if (!socket) {
        console.error('Socket is undefined in handleRemoteGame');
        return;
    }
    
    const playerNumber = await addPlayerToMatch(parseInt(matchId), socket, username);

    if (playerNumber === null) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Match is full'
        }));
        socket.close(1000, 'Match is full');
        return;
    }
    
    const match = getMatch(parseInt(matchId));
    if (!match) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to initialize match'
        }));
        socket.close(1011, 'Match initialization failed');
        return;
    }
    
    const successMessage = JSON.stringify({
        type: 'success',
        playerNumber: playerNumber,
        message: `You are player ${playerNumber}`,
        player1Username: match.state.player1Alias || 'Player 1',
        player2Username: match.state.player2Alias || 'Player 2'
    });
    
    socket.send(successMessage);

    if (match.state.connectedPlayers === 2) {
        const readyMessage = JSON.stringify({
            type: 'ready',
            message: 'Both players connected! Match ready to start.',
            player1Username: match.state.player1Alias || 'Player 1',
            player2Username: match.state.player2Alias || 'Player 2'
        });
        
        if (match.player1)
            match.player1.send(readyMessage);
        if (match.player2)
            match.player2.send(readyMessage);
        
        if (match.state.gameLoopInterval) {
            clearInterval(match.state.gameLoopInterval);
        }
        
        // Start countdown before starting the game
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            const countdownMessage = JSON.stringify({
                type: 'countdown',
                count: countdown,
                message: `Game starting in ${countdown}...`
            });
            
            if (match.player1) match.player1.send(countdownMessage);
            if (match.player2) match.player2.send(countdownMessage);
            
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                
                // Start the actual game
                const gameStartMessage = JSON.stringify({
                    type: 'game-start',
                    message: 'Game started!'
                });
                
                if (match.player1) match.player1.send(gameStartMessage);
                if (match.player2) match.player2.send(gameStartMessage);
                
                // Start the game loop
                match.state.gameLoopInterval = setInterval(() => updateBall(parseInt(matchId)), 16);
            }
        }, 1000);
    } else {
        // Send waiting message to the connected player
        const waitingMessage = JSON.stringify({
            type: 'waiting',
            message: 'Waiting for opponent to join...',
            connectedPlayers: match.state.connectedPlayers
        });
        socket.send(waitingMessage);
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
        }
    });

    socket.removeAllListeners('close');
    socket.on('close', async (code, reason) => {
        await removePlayerFromMatch(parseInt(matchId), socket);
        const remainingMatch = getMatch(parseInt(matchId));
        
        if (remainingMatch) {
            const disconnectMessage = JSON.stringify({
                type: 'disconnect',
                message: `Player ${playerNumber} has disconnected`
            });
            
            if (remainingMatch.player1) remainingMatch.player1.send(disconnectMessage);
            if (remainingMatch.player2) remainingMatch.player2.send(disconnectMessage);
        }
    });
}

// Simple remote game handler for the WebSocket server
export function handleSimpleRemoteGame(ws, request) {
    console.log('🔌 Simple remote game connection attempt');
    
    if (!ws) {
        console.error('❌ No WebSocket connection available');
        return;
    }
    
    try {
        const url = new URL(request.url, 'http://localhost:3001');
        const path = url.pathname;
        const matchId = path.split('/').pop();
        const username = url.searchParams.get('username') || 'Anonymous';
        
        console.log('✅ Simple WebSocket connection established');
        console.log('📝 Match ID:', matchId, 'Username:', username);
        
        // Check if this user is already in the match
        const existingPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
        const isAlreadyInMatch = existingPlayers.some(playerKey => playerKey.includes(username));
        
        if (isAlreadyInMatch) {
            console.log(`❌ User ${username} is already in match ${matchId}`);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'You are already in this match!'
            }));
            ws.close();
            return;
        }
        
        // Remove any stale connections for this user in this match (cleanup)
        existingPlayers.forEach(playerKey => {
            if (playerKey.includes(username)) {
                console.log(`🧹 Removing stale connection for ${username} in match ${matchId}`);
                const staleSocket = connectedPlayers.get(playerKey);
                if (staleSocket) {
                    staleSocket.close();
                }
                connectedPlayers.delete(playerKey);
            }
        });
        
        // Store player connection
        const playerKey = `${matchId}-${username}-${Date.now()}`;
        connectedPlayers.set(playerKey, ws);
        
        // Check if we have 2 players for this match
        const matchPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
        const playerNumber = matchPlayers.length;
        
        console.log(`📊 Players in match ${matchId}:`, matchPlayers.length, 'players');
        
        // Send success message with player number
        const successMessage = JSON.stringify({
            type: 'success',
            playerNumber: playerNumber,
            message: `Connected as Player ${playerNumber}`,
            player1Username: playerNumber === 1 ? username : 'Waiting...',
            player2Username: playerNumber === 2 ? username : 'Waiting...'
        });
        
        ws.send(successMessage);
        
        if (matchPlayers.length === 1) {
            // Send waiting message for first player
            const waitingMessage = JSON.stringify({
                type: 'waiting',
                message: 'Waiting for opponent to join...'
            });
            ws.send(waitingMessage);
        } else if (matchPlayers.length === 2) {
            // Both players connected, start the game
            const readyMessage = JSON.stringify({
                type: 'ready',
                message: 'Both players ready! Game starting...',
                player1Username: matchPlayers[0].split('-')[1],
                player2Username: matchPlayers[1].split('-')[1]
            });
            
            // Send to both players
            matchPlayers.forEach(playerKey => {
                const playerSocket = connectedPlayers.get(playerKey);
                if (playerSocket && playerSocket.readyState === 1) {
                    playerSocket.send(readyMessage);
                }
            });
            
            // Start countdown
            setTimeout(() => {
                const countdownMessage = JSON.stringify({
                    type: 'countdown',
                    count: 3
                });
                matchPlayers.forEach(playerKey => {
                    const playerSocket = connectedPlayers.get(playerKey);
                    if (playerSocket && playerSocket.readyState === 1) {
                        playerSocket.send(countdownMessage);
                    }
                });
                
                // Start game after countdown
                setTimeout(() => {
                    const gameStartMessage = JSON.stringify({
                        type: 'game-start',
                        message: 'Game started!'
                    });
                    matchPlayers.forEach(playerKey => {
                        const playerSocket = connectedPlayers.get(playerKey);
                        if (playerSocket && playerSocket.readyState === 1) {
                            playerSocket.send(gameStartMessage);
                        }
                    });
                    
                    // Start game loop
                    startGameForPlayers(matchPlayers, matchId);
                }, 3000);
            }, 1000);
        }
        
        // Handle incoming messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 Received game message:', data);
                
                if (data.type === 'input') {
                    // Handle player input
                    handleSimplePlayerInput(matchId, playerNumber, data.inputType, data.key);
                } else if (data.type === 'play-again') {
                    // Handle play again request
                    handlePlayAgainRequest(playerKey, matchId);
                }
            } catch (error) {
                console.error('❌ Error parsing game message:', error);
            }
        });
        
        // Handle disconnection
        ws.on('close', () => {
            console.log('🔌 Player disconnected:', username);
            
            // Remove the player from connectedPlayers
            connectedPlayers.delete(playerKey);
            
            // Stop the game if it's running
            const gameState = gameStates.get(matchId);
            if (gameState && gameState.isActive) {
                console.log(`🛑 Stopping game due to player disconnect: ${username}`);
                if (gameState.gameLoop) {
                    clearInterval(gameState.gameLoop);
                    gameState.isActive = false;
                }
            }
            
            // Clean up game state for this match if no players remain
            const remainingPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
            if (remainingPlayers.length === 0) {
                console.log(`🗑️ Cleaning up game state for match ${matchId} - no players remaining`);
                gameStates.delete(matchId);
                playAgainRequests.delete(matchId);
            }
            
            // Notify other players in the same match
            const matchPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
            matchPlayers.forEach(otherPlayerKey => {
                if (otherPlayerKey !== playerKey) {
                    const otherPlayerSocket = connectedPlayers.get(otherPlayerKey);
                    if (otherPlayerSocket && otherPlayerSocket.readyState === 1) {
                        otherPlayerSocket.send(JSON.stringify({
                            type: 'opponent-disconnected',
                            message: `${username} disconnected from the game`
                        }));
                    }
                }
            });
            
            console.log(`✅ Player ${username} cleanup completed for match ${matchId}`);
        });
        
    } catch (error) {
        console.error('❌ Error in simple remote game:', error);
        if (ws && ws.readyState === 1) {
            ws.close(1011, 'Internal server error');
        }
    }
}