const { runQuery, getQuery, allQuery } = require('../database');

// Game state management
const activeGames = new Map();

// Create a new game
async function createGame(request, reply) {
    try {
        const { gameType, player1Id, player2Id } = request.body;
        
        // Validate game type
        const validGameTypes = ['1v1', '1vAI', 'online', 'tournament'];
        if (!validGameTypes.includes(gameType)) {
            return reply.status(400).send({ error: 'Invalid game type' });
        }

        // Create game record in database
        const result = await runQuery(
            'INSERT INTO games (game_type, player1_id, player2_id, status) VALUES (?, ?, ?, ?)',
            [gameType, player1Id, player2Id || null, 'active']
        );

        // Initialize game state
        const gameState = {
            id: result.id,
            gameType,
            player1Id,
            player2Id,
            status: 'active',
            ball: {
                x: 400,
                y: 300,
                velocityX: 5,
                velocityY: 3,
                radius: 10
            },
            paddles: {
                player1: { x: 50, y: 250, width: 15, height: 100, velocity: 0 },
                player2: { x: 750, y: 250, width: 15, height: 100, velocity: 0 }
            },
            scores: {
                player1: 0,
                player2: 0
            },
            powerUps: [],
            lastUpdate: Date.now()
        };

        activeGames.set(result.id, gameState);

        reply.status(201).send({
            message: 'Game created successfully',
            gameId: result.id,
            gameState
        });
    } catch (error) {
        console.error('Create game error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Get game state
async function getGameState(request, reply) {
    try {
        const { gameId } = request.params;
        
        const gameState = activeGames.get(parseInt(gameId));
        if (!gameState) {
            return reply.status(404).send({ error: 'Game not found' });
        }

        reply.status(200).send({ gameState });
    } catch (error) {
        console.error('Get game state error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Update game state (for player input)
async function updateGameState(request, reply) {
    try {
        const { gameId } = request.params;
        const { playerId, action, key } = request.body;
        
        const gameState = activeGames.get(parseInt(gameId));
        if (!gameState) {
            return reply.status(404).send({ error: 'Game not found' });
        }

        // Handle player input
        if (action === 'paddle_move') {
            const paddle = playerId === gameState.player1Id ? 'player1' : 'player2';
            
            if (key === 'up') {
                gameState.paddles[paddle].velocity = -8;
            } else if (key === 'down') {
                gameState.paddles[paddle].velocity = 8;
            } else if (key === 'stop') {
                gameState.paddles[paddle].velocity = 0;
            }
        }

        // Update game physics
        updateGamePhysics(gameState);

        reply.status(200).send({ 
            message: 'Game state updated',
            gameState 
        });
    } catch (error) {
        console.error('Update game state error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

// Game physics update
function updateGamePhysics(gameState) {
    const now = Date.now();
    const deltaTime = now - gameState.lastUpdate;
    gameState.lastUpdate = now;

    // Update paddle positions
    gameState.paddles.player1.y += gameState.paddles.player1.velocity;
    gameState.paddles.player2.y += gameState.paddles.player2.velocity;

    // Paddle boundaries
    const paddleBounds = (paddle) => {
        if (paddle.y < 0) paddle.y = 0;
        if (paddle.y + paddle.height > 600) paddle.y = 600 - paddle.height;
    };

    paddleBounds(gameState.paddles.player1);
    paddleBounds(gameState.paddles.player2);

    // Update ball position
    gameState.ball.x += gameState.ball.velocityX;
    gameState.ball.y += gameState.ball.velocityY;

    // Ball collision with top/bottom walls
    if (gameState.ball.y <= 0 || gameState.ball.y >= 590) {
        gameState.ball.velocityY = -gameState.ball.velocityY;
    }

    // Ball collision with paddles
    const checkPaddleCollision = (paddle) => {
        if (gameState.ball.x < paddle.x + paddle.width &&
            gameState.ball.x + gameState.ball.radius > paddle.x &&
            gameState.ball.y < paddle.y + paddle.height &&
            gameState.ball.y + gameState.ball.radius > paddle.y) {
            
            // Reverse ball direction
            gameState.ball.velocityX = -gameState.ball.velocityX;
            
            // Add some randomness to ball direction
            gameState.ball.velocityY += (Math.random() - 0.5) * 2;
            
            // Ensure ball doesn't get stuck
            if (Math.abs(gameState.ball.velocityY) < 2) {
                gameState.ball.velocityY = Math.random() > 0.5 ? 3 : -3;
            }
        }
    };

    checkPaddleCollision(gameState.paddles.player1);
    checkPaddleCollision(gameState.paddles.player2);

    // Ball out of bounds (scoring)
    if (gameState.ball.x <= 0) {
        gameState.scores.player2++;
        resetBall(gameState, 'player1');
    } else if (gameState.ball.x >= 800) {
        gameState.scores.player1++;
        resetBall(gameState, 'player2');
    }

    // Check for game end
    if (gameState.scores.player1 >= 11 || gameState.scores.player2 >= 11) {
        endGame(gameState);
    }
}

// Reset ball to center
function resetBall(gameState, servingPlayer) {
    gameState.ball.x = 400;
    gameState.ball.y = 300;
    gameState.ball.velocityX = servingPlayer === 'player1' ? 5 : -5;
    gameState.ball.velocityY = (Math.random() - 0.5) * 6;
}

// End game and save results
async function endGame(gameState) {
    try {
        const winnerId = gameState.scores.player1 >= 11 ? gameState.player1Id : gameState.player2Id;
        
        // Update database
        await runQuery(
            'UPDATE games SET winner_id = ?, status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?',
            [winnerId, 'completed', gameState.id]
        );

        // Update player stats
        await runQuery(
            'UPDATE users SET games_played = games_played + 1, wins = wins + 1 WHERE id = ?',
            [winnerId]
        );

        const loserId = winnerId === gameState.player1Id ? gameState.player2Id : gameState.player1Id;
        await runQuery(
            'UPDATE users SET games_played = games_played + 1, losses = losses + 1 WHERE id = ?',
            [loserId]
        );

        gameState.status = 'completed';
        activeGames.delete(gameState.id);

    } catch (error) {
        console.error('End game error:', error);
    }
}

// Get user game history
async function getUserGameHistory(request, reply) {
    try {
        const userId = request.user.userId;
        
        const games = await allQuery(
            `SELECT g.*, 
                    u1.username as player1_name, 
                    u2.username as player2_name,
                    winner.username as winner_name
             FROM games g
             LEFT JOIN users u1 ON g.player1_id = u1.id
             LEFT JOIN users u2 ON g.player2_id = u2.id
             LEFT JOIN users winner ON g.winner_id = winner.id
             WHERE g.player1_id = ? OR g.player2_id = ?
             ORDER BY g.created_at DESC`,
            [userId, userId]
        );

        reply.status(200).send({ games });
    } catch (error) {
        console.error('Get game history error:', error);
        reply.status(500).send({ error: 'Internal server error' });
    }
}

module.exports = {
    createGame,
    getGameState,
    updateGameState,
    getUserGameHistory
};
