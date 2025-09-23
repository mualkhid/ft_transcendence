import { prisma } from '../prisma/prisma_lib.js';
import { GAME_CONFIG, getCanvasCenter, getPaddleStartPositions, getPaddleBounds } from '../config/gameConfig.js';

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

    // Fixed AI configuration (no difficulty selection)
    const aiConfig = {
        tolerance: 10,           // Fixed tolerance
        predictionAccuracy: 0.9, // Fixed prediction accuracy
        reactionDelay: 50        // Fixed reaction delay
    };

    let gameState = {
        ballX: canvasCenter.x,
        ballY: canvasCenter.y,
        ballSpeedX: GAME_CONFIG.BALL.SPEED_X,
        ballSpeedY: GAME_CONFIG.BALL.SPEED_Y,
        ballRadius: GAME_CONFIG.BALL.RADIUS,
        playerPaddleX: 50, // Left paddle X position
        playerPaddleY: paddlePositions.player,
        aiPaddleX: 735, // Right paddle X position
        aiPaddleY: paddlePositions.ai,
        paddleWidth: GAME_CONFIG.PADDLE.WIDTH,
        paddleHeight: GAME_CONFIG.PADDLE.HEIGHT,
        playerScore: 0,
        aiScore: 0,
        gameStarted: false,
        gameOver: false,
        winningScore: GAME_CONFIG.GAME.WINNING_SCORE,
        aiConfig: aiConfig
    };

    let gameStartTime = null;

    let gameLoop = null;
    let aiMoveInterval = null;

    // AI paddle movement logic with fixed parameters
    function moveAI() {
        if (!gameState.gameStarted || gameState.gameOver) return;

        // Predict where the ball will be when it reaches the AI paddle
        const targetY = predictBallY();
        
        // Add fixed prediction errors (simulates human fallibility)
        const predictionError = (1 - aiConfig.predictionAccuracy) * 100;
        const adjustedTargetY = targetY + (Math.random() - 0.5) * predictionError;
        
        // Move AI paddle towards the predicted position
        const aiPaddleCenter = gameState.aiPaddleY + GAME_CONFIG.PADDLE.HEIGHT / 2;
        const tolerance = aiConfig.tolerance;
        
        if (aiPaddleCenter < adjustedTargetY - tolerance) {
            gameState.aiPaddleY += GAME_CONFIG.PADDLE.SPEED; // Move down - use unified speed
        } else if (aiPaddleCenter > adjustedTargetY + tolerance) {
            gameState.aiPaddleY -= GAME_CONFIG.PADDLE.SPEED; // Move up - use unified speed
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

        // Reduce tunneling: use previous position and crossing checks against paddle planes
        const prevX = gameState.ballX - gameState.ballSpeedX;
        const prevY = gameState.ballY - gameState.ballSpeedY;

        // Left paddle (player) - ball moving left and crossing paddle plane
        const leftPaddleRightEdge = gameState.playerPaddleX + gameState.paddleWidth;
        const ballLeftEdge = gameState.ballX - gameState.ballRadius;
        
        if (gameState.ballSpeedX < 0 && 
            prevX > leftPaddleRightEdge && ballLeftEdge <= leftPaddleRightEdge &&
            gameState.ballY >= gameState.playerPaddleY &&
            gameState.ballY <= gameState.playerPaddleY + gameState.paddleHeight) {
            
            // Clamp ball to paddle surface to prevent tunneling
            gameState.ballX = leftPaddleRightEdge + gameState.ballRadius;
            gameState.ballSpeedX = Math.abs(gameState.ballSpeedX);
            
            // Additional safety: ensure ball is not behind paddle
            if (gameState.ballX < leftPaddleRightEdge) {
                gameState.ballX = leftPaddleRightEdge + gameState.ballRadius + 1;
            }
            
            const spin = (Math.random() - 0.5) * 2;
            gameState.ballSpeedY = Math.max(-8, Math.min(8, gameState.ballSpeedY + spin));
        }

        // Right paddle (AI) - ball moving right and crossing paddle plane
        const rightPaddleLeftEdge = gameState.aiPaddleX;
        const ballRightEdge = gameState.ballX + gameState.ballRadius;
        
        if (gameState.ballSpeedX > 0 && 
            prevX < rightPaddleLeftEdge && ballRightEdge >= rightPaddleLeftEdge &&
            gameState.ballY >= gameState.aiPaddleY &&
            gameState.ballY <= gameState.aiPaddleY + gameState.paddleHeight) {
            
            // Clamp ball to paddle surface to prevent tunneling
            gameState.ballX = rightPaddleLeftEdge - gameState.ballRadius;
            gameState.ballSpeedX = -Math.abs(gameState.ballSpeedX);
            
            // Additional safety: ensure ball is not behind paddle
            if (gameState.ballX > rightPaddleLeftEdge) {
                gameState.ballX = rightPaddleLeftEdge - gameState.ballRadius - 1;
            }
            
            const spin = (Math.random() - 0.5) * 2;
            gameState.ballSpeedY = Math.max(-8, Math.min(8, gameState.ballSpeedY + spin));
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
            
            // Game result will be saved by the frontend through the authenticated endpoint
            console.log('AI game finished - result will be saved by frontend');
            
            socket.send(JSON.stringify({
                type: 'game-over',
                winner: gameState.playerScore > gameState.aiScore ? 'player' : 'ai',
                playerScore: gameState.playerScore,
                aiScore: gameState.aiScore,
            }));
            stopGame();
            return;
        }

        // Send updated game state
        socket.send(JSON.stringify({
            type: 'game-update',
            gameState: {
                ...gameState,
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
        console.log('🎯 startGame() called, gameState.gameStarted:', gameState.gameStarted);
        if (gameState.gameStarted) {
            console.log('⚠️ Game already started, returning');
            return;
        }
        
        console.log('✅ Starting new AI game...');
        gameState.gameStarted = true;
        gameState.gameOver = false;
        gameState.playerScore = 0;
        gameState.aiScore = 0;
        gameStartTime = new Date(); // Record actual game start time
        resetBall();
        
        // Start game loop
        gameLoop = setInterval(updateBall, GAME_CONFIG.GAME.GAME_LOOP_INTERVAL);
        aiMoveInterval = setInterval(moveAI, aiConfig.reactionDelay);
        
        console.log('📤 Sending game-started message to frontend');
        socket.send(JSON.stringify({
            type: 'game-started',
            message: 'AI Pong Game Started!',
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



    // Handle incoming messages
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('🎮 AI Game received message:', data.type, data);
            
            switch (data.type) {
                case 'start-game':
                    console.log('🚀 Starting AI game...');
                    startGame();
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
    };

    // Handle connection close
    socket.onclose = () => {
        console.log('AI Game WebSocket connection closed');
        stopGame();
    };

    // Send initial game state
    socket.send(JSON.stringify({
        type: 'game-state',
        gameState: {
            ...gameState,
            aiConfig: aiConfig
        }
    }));
}

// Save AI game result to database
export async function saveAIGameResult(userId, playerScore, aiScore, gameType, gameStartTime = null) {
    try {
        // Get user info to get the actual username
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const now = new Date();
        const startTime = gameStartTime || new Date(now.getTime() - 60000); // Default to 1 minute ago if no start time

        const result = await prisma.match.create({
            data: {
                player1Alias: user.username,
                player2Alias: 'AI',
                winnerAlias: playerScore > aiScore ? user.username : 'AI',
                status: 'FINISHED',
                startedAt: startTime,
                finishedAt: now,
                roundNumber: 1,  // AI games are always round 1
                matchNumber: 1   // AI games are always match 1
            }
        });

        // Create match players
        await prisma.matchPlayer.createMany({
            data: [
                {
                    matchId: result.id,
                    alias: user.username,
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
