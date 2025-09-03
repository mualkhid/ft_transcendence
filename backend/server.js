import { WebSocketServer } from 'ws';

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Store connected players
const connectedPlayers = new Map();
const gameMatches = new Map();

// Game state for each match
const gameStates = new Map();

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

// Update ball position and check collisions
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
        const gameStateMessage = JSON.stringify({
            type: 'game-state',
            ballX: gameState.ballX,
            ballY: gameState.ballY,
            leftPaddleY: gameState.leftPaddleY,
            rightPaddleY: gameState.rightPaddleY,
            player1Score: gameState.player1Score,
            player2Score: gameState.player2Score
        });
        
        matchPlayers.forEach(playerKey => {
            const playerWs = connectedPlayers.get(playerKey);
            if (playerWs && playerWs.readyState === 1) {
                playerWs.send(gameStateMessage);
            }
        });
    }
}

// Reset ball to center
function resetBall(gameState) {
    gameState.ballX = 400;
    gameState.ballY = 300;
    gameState.ballSpeedX = Math.random() > 0.5 ? 5 : -5;
    gameState.ballSpeedY = Math.random() > 0.5 ? 3 : -3;
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
    
    // Start countdown
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
}

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
    console.log('🔌 WebSocket connection established!');
    
    // Extract matchId and username from URL
    const url = new URL(request.url, 'http://localhost:3000');
    const matchId = url.pathname.split('/').pop();
    const username = url.searchParams.get('username') || 'Anonymous';
    
    console.log('📝 Player connected:', { matchId, username });
    
    // Send immediate success message
    const successMessage = JSON.stringify({
        type: 'success',
        playerNumber: 1,
        message: 'Connected to remote game',
        player1Username: username,
        player2Username: 'Waiting...'
    });
    
    ws.send(successMessage);
    
    // Send waiting message
    const waitingMessage = JSON.stringify({
        type: 'waiting',
        message: 'Waiting for opponent to join...'
    });
    
    ws.send(waitingMessage);
    
    // Store the connection with player number
    const existingPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
    const playerNumber = existingPlayers.length + 1; // Player 1 or Player 2
    const playerKey = `${matchId}-${username}-${Date.now()}-${playerNumber}`;
    connectedPlayers.set(playerKey, ws);
    
    console.log(`📝 Player connected: ${username} as Player ${playerNumber}`);
    
    // Check if we have 2 players for this match
    const matchPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
    
    console.log(`📊 Players in match ${matchId}:`, matchPlayers.length, 'players');
    console.log('🔑 Player keys:', matchPlayers);
    
    // If more than 2 players, kick out the oldest ones
    if (matchPlayers.length > 2) {
        console.log('⚠️ Too many players, kicking out oldest connections');
        const sortedPlayers = matchPlayers.sort((a, b) => {
            const timeA = parseInt(a.split('-')[2]);
            const timeB = parseInt(b.split('-')[2]);
            return timeA - timeB;
        });
        
        // Keep only the 2 newest players
        const playersToKeep = sortedPlayers.slice(-2);
        const playersToKick = sortedPlayers.slice(0, -2);
        
        playersToKick.forEach(playerKey => {
            const playerWs = connectedPlayers.get(playerKey);
            if (playerWs && playerWs.readyState === 1) {
                playerWs.send(JSON.stringify({
                    type: 'error',
                    message: 'Match is full. Please try again.'
                }));
                playerWs.close(1000, 'Match is full');
            }
            connectedPlayers.delete(playerKey);
        });
        
        console.log('👋 Kicked out players:', playersToKick);
        console.log('✅ Kept players:', playersToKeep);
        
        // Update matchPlayers to only include the 2 remaining players
        const remainingPlayers = playersToKeep;
        if (remainingPlayers.length === 2) {
            startGameForPlayers(remainingPlayers, matchId);
        }
    } else if (matchPlayers.length === 2) {
        startGameForPlayers(matchPlayers, matchId);
    }
    
    // Handle disconnection
    ws.on('close', () => {
        console.log('🔌 Player disconnected:', username);
        connectedPlayers.delete(playerKey);
        
        // Clean up game state if no players left
        const matchPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
        if (matchPlayers.length === 0) {
            const gameState = gameStates.get(matchId);
            if (gameState && gameState.gameLoop) {
                clearInterval(gameState.gameLoop);
                console.log('🛑 Game loop stopped for match', matchId);
            }
            gameStates.delete(matchId);
            console.log('🗑️ Game state cleaned up for match', matchId);
        }
    });
    
    // Handle messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📨 Received message:', data);
            
            if (data.type === 'input') {
                const gameState = gameStates.get(matchId);
                if (!gameState || !gameState.isActive) return;
                
                const paddleSpeed = 10;
                
                if (data.inputType === 'keydown') {
                    // Extract player number from playerKey (format: matchId-username-timestamp-playerNumber)
                    const playerNumber = parseInt(playerKey.split('-')[3]);
                    
                    if (data.key === 'up') {
                        // Move paddle up
                        if (playerNumber === 1) {
                            gameState.leftPaddleY = Math.max(0, gameState.leftPaddleY - paddleSpeed);
                        } else if (playerNumber === 2) {
                            gameState.rightPaddleY = Math.max(0, gameState.rightPaddleY - paddleSpeed);
                        }
                    } else if (data.key === 'down') {
                        // Move paddle down
                        if (playerNumber === 1) {
                            gameState.leftPaddleY = Math.min(500, gameState.leftPaddleY + paddleSpeed);
                        } else if (playerNumber === 2) {
                            gameState.rightPaddleY = Math.min(500, gameState.rightPaddleY + paddleSpeed);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    });
});

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/users.js';
import tournamentRoutes from './routes/tournament.js';
import remoteGameRoutes from './routes/remoteGameRoutes.js';
import friendsRoutes from './routes/friendsRoute.js';
import profileRoutes from './routes/profileRoutes.js';

import { globalErrorHandler } from './utils/errorHandler.js';
import { trackUserActivity } from './services/lastSeenService.js';
import { getSecrets } from './services/vaultService.js';
import dotenv from 'dotenv';
import cookie from '@fastify/cookie';
import {prisma } from './prisma/prisma_lib.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

dotenv.config();

const fastify = Fastify();
fastify.setErrorHandler(globalErrorHandler);

// Needed to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Register plugins BEFORE starting server
fastify.register(fastifyCors, {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost', 'https://127.0.0.1'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', 
});

await fastify.register(fastifyWebsocket);


fastify.register(swagger, {
  swagger: {
    info: { title: 'fastify-api', version: '1.0.0' },
  },
});

// In your server.js or main file

// Register the cookie plugin
fastify.register(cookie);

fastify.register(fastifyMultipart, {
  limits: { file: 1, filesize: 5 * 1024 * 1024 },
});

fastify.register(swaggerUI, {
  routePrefix: '/docs',
  exposeRoute: true,
});

//Munia Please check if this interferes with your work or not I closed it for websockets to work  -Sumaya 
await fastify.register(helmet, {
  contentSecurityPolicy: false, // Completely disable CSP
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
});

// //Security + Rate limiting
fastify.register(rateLimit, {
  max: 20,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'],
  skip: (request) => request.headers.upgrade && request.headers.upgrade.toLowerCase() === 'websocket'
});



// 🔹 Register routes
fastify.register(tournamentRoutes, { prefix: '/api' });
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(friendsRoutes, { prefix: '/api' });
fastify.register(profileRoutes, { prefix: '/api' });
fastify.register(remoteGameRoutes, { prefix: '/api' });

// Also register without prefix for testing
fastify.register(remoteGameRoutes);

// Register test WebSocket route directly
fastify.get('/ws-test', { websocket: true }, async (connection, request) => {
    console.log('🧪 Direct WebSocket test');
    if (connection.socket) {
        console.log('✅ Direct WebSocket socket available');
        connection.socket.send(JSON.stringify({ type: 'test', message: 'Direct WebSocket working!' }));
    } else {
        console.log('❌ Direct WebSocket socket not available');
    }
});

// Register simple remote game route without plugin
fastify.get('/simple-remote/:matchId', { websocket: true }, async (connection, request) => {
    console.log('🔌 Simple remote game connection attempt');
    
    if (!connection.socket) {
        console.error('❌ No WebSocket connection available');
        return;
    }
    
    try {
        const matchId = request.params.matchId;
        const username = request.query?.username || 'Anonymous';
        
        console.log('✅ Simple WebSocket connection established');
        console.log('📝 Match ID:', matchId, 'Username:', username);
        
        // Send immediate success message
        const successMessage = JSON.stringify({
            type: 'success',
            playerNumber: 1,
            message: 'Connected to simple remote game',
            player1Username: username,
            player2Username: 'Waiting...'
        });
        
        connection.socket.send(successMessage);
        
        // Send waiting message
        const waitingMessage = JSON.stringify({
            type: 'waiting',
            message: 'Waiting for opponent to join...'
        });
        
        connection.socket.send(waitingMessage);
        
    } catch (error) {
        console.error('❌ Error in simple remote game:', error);
        if (connection.socket && connection.socket.readyState === 1) {
            connection.socket.close(1011, 'Internal server error');
        }
    }
});

console.log('Routes registered successfully');

// setupGracefulShutdown(fastify, prisma);

// 🔹 Start server LAST
try {
  console.log('Attempting to start server...');
  const address = await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log(`Server running at ${address}`);
  
  // Attach WebSocket server to HTTP server
  const server = fastify.server;
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, 'http://localhost:3000').pathname;
    
    if (pathname.startsWith('/simple-remote/')) {
      console.log('🔄 Upgrading to WebSocket for:', pathname);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
  
  console.log('✅ WebSocket server attached to HTTP server');
} catch (err) {
  console.error("Server startup error:", err);
  fastify.log.error("catched in server => ", err);
  process.exit(1);
}

// 🔹 After server boot, safe to use secrets or configs
const secrets = await getSecrets();
const jwtSecret = secrets.JWT_SECRET;
const dbPassword = secrets.DB_PASSWORD;
