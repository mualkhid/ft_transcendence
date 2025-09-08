import { prisma } from '../prisma/prisma_lib.js';
import { GAME_CONFIG, getCanvasCenter, getPaddleStartPositions, getPaddleBounds, getAIDifficulty } from '../config/gameConfig.js';

export async function handleAIGame(socket, request) {
    console.log('AI Game WebSocket connection established');
    
    // Send initial connection success
    socket.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to AI Pong Game'
    }));

    // Get initial positions from configuration
    const canvasCenter = getCanvasCenter();
    const paddlePositions = getPaddleStartPositions();

    // Initialize with medium difficulty
    let currentDifficulty = 'MEDIUM';
    let aiConfig = getAIDifficulty(currentDifficulty);

    let gameState = {
        ballX: canvasCenter.x,
        ballY: canvasCenter.y,
        ballSpeedX: GAME_CONFIG.BALL.SPEED_X,
        ballSpeedY: GAME_CONFIG.BALL.SPEED_Y,
        ballRadius: GAME_CONFIG.BALL.RADIUS,
        playerPaddleY: paddlePositions.player,
        aiPaddleY: paddlePositions.ai,
        playerScore: 0,
        aiScore: 0,
        gameStarted: false,
        gameOver: false,
        winningScore: GAME_CONFIG.GAME.WINNING_SCORE,
        currentDifficulty: currentDifficulty,
        aiConfig: aiConfig
    };

    let gameLoop = null;
    let aiMoveInterval = null;

    // AI paddle movement logic with difficulty-based behavior
    function moveAI() {
        if (!gameState.gameStarted || gameState.gameOver) return;

        // Get current AI configuration
        aiConfig = getAIDifficulty(currentDifficulty);

        // Predict where the ball will be when it reaches the AI paddle
        const targetY = predictBallY();
        
        // Add difficulty-based prediction errors
        const predictionError = (1 - aiConfig.predictionAccuracy) * 100;
        const adjustedTargetY = targetY + (Math.random() - 0.5) * predictionError;
        
        // Move AI paddle towards the predicted position
        const aiPaddleCenter = gameState.aiPaddleY + GAME_CONFIG.PADDLE.HEIGHT / 2;
        const tolerance = aiConfig.tolerance;
        
        if (aiPaddleCenter < adjustedTargetY - tolerance) {
            gameState.aiPaddleY += aiConfig.speed; // Move down
        } else if (aiPaddleCenter > adjustedTargetY + tolerance) {
            gameState.aiPaddleY -= aiConfig.speed; // Move up
        }
        
        // Keep AI paddle within canvas bounds
        gameState.aiPaddleY = Math.max(0, Math.min(GAME_CONFIG.CANVAS.HEIGHT - GAME_CONFIG.PADDLE.HEIGHT, gameState.aiPaddleY));
    }

    // Predict ball Y position when it reaches AI paddle
    function predictBallY() {
        let x = gameState.ballX;
        let y = gameState.ballY;
        let dx = gameState.ballSpeedX;
        let dy = gameState.ballSpeedY;
        
        // Simulate ball movement until it reaches AI paddle
        const aiPaddleX = GAME_CONFIG.CANVAS.WIDTH - GAME_CONFIG.PADDLE.WIDTH;
        const playerPaddleX = GAME_CONFIG.PADDLE.WIDTH;
        
        while (x < aiPaddleX && x > playerPaddleX) {
            x += dx;
            y += dy;
            
            // Handle top/bottom wall collisions
            if (y <= GAME_CONFIG.BALL.RADIUS || y >= GAME_CONFIG.CANVAS.HEIGHT - GAME_CONFIG.BALL.RADIUS) {
                dy = -dy;
            }
        }
        
        return y;
    }

    // Update ball position
    async function updateBall() {
        if (!gameState.gameStarted || gameState.gameOver) return;

        gameState.ballX += gameState.ballSpeedX;
        gameState.ballY += gameState.ballSpeedY;

        // Wall collisions (top/bottom)
        if (gameState.ballY <= GAME_CONFIG.BALL.RADIUS || gameState.ballY >= GAME_CONFIG.CANVAS.HEIGHT - GAME_CONFIG.BALL.RADIUS) {
            gameState.ballSpeedY = -gameState.ballSpeedY;
        }

        // Paddle collisions using helper functions
        // Player paddle (left)
        const playerPaddleBounds = getPaddleBounds(gameState.playerPaddleY, true);
        
        if (gameState.ballX <= playerPaddleBounds.right && 
            gameState.ballY >= playerPaddleBounds.top && 
            gameState.ballY <= playerPaddleBounds.bottom) {
            gameState.ballSpeedX = -gameState.ballSpeedX;
            // Add some angle based on where ball hits paddle
            const offset = (gameState.ballY - playerPaddleBounds.center) / (GAME_CONFIG.PADDLE.HEIGHT / 2);
            gameState.ballSpeedY = GAME_CONFIG.BALL.SPEED_X * offset;
        }

        // AI paddle (right)
        const aiPaddleBounds = getPaddleBounds(gameState.aiPaddleY, false);
        
        if (gameState.ballX >= aiPaddleBounds.left && 
            gameState.ballY >= aiPaddleBounds.top && 
            gameState.ballY <= aiPaddleBounds.bottom) {
            gameState.ballSpeedX = -gameState.ballSpeedX;
            // Add some angle based on where ball hits paddle
            const offset = (gameState.ballY - aiPaddleBounds.center) / (GAME_CONFIG.PADDLE.HEIGHT / 2);
            gameState.ballSpeedY = GAME_CONFIG.BALL.SPEED_X * offset;
        }

        // Scoring
        if (gameState.ballX < 0) {
            gameState.aiScore++;
            resetBall(1); // Ball goes right
        } else if (gameState.ballX > GAME_CONFIG.CANVAS.WIDTH) {
            gameState.playerScore++;
            resetBall(-1); // Ball goes left
        }

        // Check for game over
        if (gameState.playerScore >= gameState.winningScore || gameState.aiScore >= gameState.winningScore) {
            gameState.gameOver = true;
            
            // Save game result to database
            try {
                await saveAIGameResult(null, gameState.playerScore, gameState.aiScore, 'AI_PONG');
                console.log('AI game result saved to database');
            } catch (error) {
                console.error('Failed to save AI game result:', error);
            }
            
            socket.send(JSON.stringify({
                type: 'game-over',
                winner: gameState.playerScore > gameState.aiScore ? 'player' : 'ai',
                playerScore: gameState.playerScore,
                aiScore: gameState.aiScore,
                difficulty: currentDifficulty
            }));
            stopGame();
            return;
        }

        // Send updated game state
        socket.send(JSON.stringify({
            type: 'game-update',
            gameState: {
                ...gameState,
                currentDifficulty: currentDifficulty,
                aiConfig: aiConfig
            }
        }));
    }

    // Reset ball to center
    function resetBall(direction = 1) {
        const center = getCanvasCenter();
        gameState.ballX = center.x;
        gameState.ballY = center.y;
        gameState.ballSpeedX = direction * GAME_CONFIG.BALL.SPEED_X;
        gameState.ballSpeedY = (Math.random() - 0.5) * GAME_CONFIG.BALL.SPEED_X * GAME_CONFIG.GAME.BALL_SPEED_MULTIPLIER;
    }

    // Start the game
    function startGame() {
        if (gameState.gameStarted) return;
        
        gameState.gameStarted = true;
        gameState.gameOver = false;
        gameState.playerScore = 0;
        gameState.aiScore = 0;
        resetBall();
        
        // Start game loop
        gameLoop = setInterval(updateBall, GAME_CONFIG.GAME.GAME_LOOP_INTERVAL);
        aiMoveInterval = setInterval(moveAI, aiConfig.reactionDelay);
        
        socket.send(JSON.stringify({
            type: 'game-started',
            message: `AI Pong Game Started! Difficulty: ${aiConfig.name}`,
            difficulty: currentDifficulty,
            aiConfig: aiConfig
        }));
    }

    // Resume the game (for unpausing)
    function resumeGame() {
        if (!gameState.gameStarted || gameState.gameOver) return;
        
        // Start game loop
        gameLoop = setInterval(updateBall, GAME_CONFIG.GAME.GAME_LOOP_INTERVAL);
        aiMoveInterval = setInterval(moveAI, aiConfig.reactionDelay);
        
        socket.send(JSON.stringify({
            type: 'game-resumed',
            message: 'Game Resumed'
        }));
    }

    // Stop the game
    function stopGame() {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        if (aiMoveInterval) {
            clearInterval(aiMoveInterval);
            aiMoveInterval = null;
        }
        gameState.gameStarted = false;
    }

    // Pause the game (without stopping it completely)
    function pauseGame() {
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        if (aiMoveInterval) {
            clearInterval(aiMoveInterval);
            aiMoveInterval = null;
        }
        // Don't set gameState.gameStarted = false for pause
    }

    // Change AI difficulty
    function changeDifficulty(newDifficulty) {
        if (gameState.gameStarted) {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Cannot change difficulty during gameplay'
            }));
            return;
        }

        if (GAME_CONFIG.AI_DIFFICULTY[newDifficulty]) {
            currentDifficulty = newDifficulty;
            aiConfig = getAIDifficulty(currentDifficulty);
            gameState.currentDifficulty = currentDifficulty;
            gameState.aiConfig = aiConfig;

            socket.send(JSON.stringify({
                type: 'difficulty-changed',
                difficulty: currentDifficulty,
                aiConfig: aiConfig,
                message: `AI difficulty changed to ${aiConfig.name}`
            }));
        } else {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Invalid difficulty level'
            }));
        }
    }

    // Handle incoming messages
    socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'start-game':
                    startGame();
                    break;
                    
                case 'change-difficulty':
                    changeDifficulty(data.difficulty);
                    break;
                    
                case 'player-input':
                    if (data.action === 'up') {
                        gameState.playerPaddleY = Math.max(0, gameState.playerPaddleY - GAME_CONFIG.PADDLE.SPEED);
                    } else if (data.action === 'down') {
                        gameState.playerPaddleY = Math.min(GAME_CONFIG.CANVAS.HEIGHT - GAME_CONFIG.PADDLE.HEIGHT, gameState.playerPaddleY + GAME_CONFIG.PADDLE.SPEED);
                    }
                    break;
                    
                case 'pause-game':
                    if (gameState.gameStarted && !gameState.gameOver) {
                        if (gameLoop) {
                            pauseGame();
                            socket.send(JSON.stringify({
                                type: 'game-paused',
                                message: 'Game Paused'
                            }));
                        } else {
                            resumeGame();
                        }
                    }
                    break;
                    
                case 'restart-game':
                    stopGame();
                    startGame();
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle connection close
    socket.on('close', () => {
        console.log('AI Game WebSocket connection closed');
        stopGame();
    });

    // Send initial game state with difficulty options
    socket.send(JSON.stringify({
        type: 'game-state',
        gameState: {
            ...gameState,
            currentDifficulty: currentDifficulty,
            aiConfig: aiConfig
        },
        availableDifficulties: Object.keys(GAME_CONFIG.AI_DIFFICULTY).map(key => ({
            key: key,
            ...GAME_CONFIG.AI_DIFFICULTY[key]
        }))
    }));
}

// Save AI game result to database
export async function saveAIGameResult(userId, playerScore, aiScore, gameType) {
    try {
        const result = await prisma.match.create({
            data: {
                player1Alias: 'Player',
                player2Alias: 'AI',
                winnerAlias: playerScore > aiScore ? 'Player' : 'AI',
                status: 'FINISHED',
                finishedAt: new Date(),
                roundNumber: 1,  // AI games are always round 1
                matchNumber: 1   // AI games are always match 1
            }
        });

        // Create match players
        await prisma.matchPlayer.createMany({
            data: [
                {
                    matchId: result.id,
                    alias: 'Player',
                    score: playerScore,
                    result: playerScore > aiScore ? 'WIN' : 'LOSS'
                },
                {
                    matchId: result.id,
                    alias: 'AI',
                    score: aiScore,
                    result: aiScore > playerScore ? 'WIN' : 'LOSS'
                }
            ]
        });

        return result;
    } catch (error) {
        console.error('Error saving AI game result:', error);
        throw error;
    }
}

// Get AI game history
export async function getAIGameHistory(userId, gameType, limit) {
    try {
        const matches = await prisma.match.findMany({
            where: {
                player2Alias: 'AI',
                status: 'FINISHED'
            },
            include: {
                players: {
                    orderBy: { alias: 'asc' }
                }
            },
            orderBy: { finishedAt: 'desc' },
            take: limit
        });

        return matches;
    } catch (error) {
        console.error('Error getting AI game history:', error);
        throw error;
    }
}
