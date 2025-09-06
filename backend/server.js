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
import { WebSocketServer } from 'ws';
import http from 'http';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/users.js';
import tournamentRoutes from './routes/tournament.js';
import remoteGameRoutes from './routes/remoteGameRoutes.js';
import friendsRoutes from './routes/friendsRoute.js';
import profileRoutes from './routes/profileRoutes.js';
import aiGameRoutes from './routes/aiGameRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import { globalErrorHandler } from './utils/errorHandler.js';
import { trackUserActivity } from './services/lastSeenService.js';
import { getSecrets } from './services/vaultService.js';
import { handleAIGame } from './controller/aiGameController.js';
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

// Store connected players and matchmaking queue
const connectedPlayers = new Map();
const gameMatches = new Map();
const matchmakingQueue = []; // Players waiting to be matched

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

// Handle player input for paddle movement
function handlePlayerInput(matchId, playerNumber, inputType, key) {
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

// WebSocket connections are now handled by Fastify routes

// 🔹 Register plugins BEFORE starting server
fastify.register(fastifyCors, {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost', 'https://127.0.0.1', 'https://10.11.1.5', 'https://0.0.0.0'],
//   origin: '*',
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
// Register API routes
fastify.register(tournamentRoutes, { prefix: '/api' });
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(userRoutes, { prefix: '/api' });
fastify.register(friendsRoutes, { prefix: '/api' });
fastify.register(profileRoutes, { prefix: '/api' });
fastify.register(remoteGameRoutes, { prefix: '/api' });
fastify.register(aiGameRoutes, { prefix: '/api' });
fastify.register(dashboardRoutes, { prefix: '/api' });

// Also register without prefix for testing
fastify.register(remoteGameRoutes);

console.log('🔌 API routes registered');

// Register test HTTP route first
fastify.get('/test-http', async (request, reply) => {
    console.log('🧪 HTTP test route hit');
    return { message: 'HTTP route working!' };
});

console.log('🔌 HTTP test route registered');

// Register test WebSocket route directly
fastify.get('/ws-test', { websocket: true }, async (connection, request) => {
    console.log('🧪 Direct WebSocket test');
    console.log('🔌 Connection object:', connection);
    console.log('🔌 Request object:', request);
    
    if (connection.socket) {
        console.log('✅ Direct WebSocket socket available');
        connection.socket.send(JSON.stringify({ type: 'test', message: 'Direct WebSocket working!' }));
    } else {
        console.log('❌ Direct WebSocket socket not available');
    }
});

console.log('🔌 WebSocket test route registered');

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
        
        // Check if this user is already in the match
        const existingPlayers = Array.from(connectedPlayers.keys()).filter(key => key.startsWith(matchId + '-'));
        const isAlreadyInMatch = existingPlayers.some(playerKey => playerKey.includes(username));
        
        if (isAlreadyInMatch) {
            console.log(`❌ User ${username} is already in match ${matchId}`);
            connection.socket.send(JSON.stringify({
                type: 'error',
                message: 'You are already in this match!'
            }));
            connection.socket.close();
            return;
        }
        
        // Store player connection
        const playerKey = `${matchId}-${username}-${Date.now()}`;
        connectedPlayers.set(playerKey, connection.socket);
        
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
        
        connection.socket.send(successMessage);
        
        if (matchPlayers.length === 1) {
            // Send waiting message for first player
            const waitingMessage = JSON.stringify({
                type: 'waiting',
                message: 'Waiting for opponent to join...'
            });
            connection.socket.send(waitingMessage);
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
        connection.socket.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 Received game message:', data);
                
                if (data.type === 'input') {
                    // Handle player input
                    handlePlayerInput(matchId, playerNumber, data.inputType, data.key);
                }
            } catch (error) {
                console.error('❌ Error parsing game message:', error);
            }
        });
        
        // Handle disconnection
        connection.socket.on('close', () => {
            console.log(`🔌 Player ${username} disconnected from match ${matchId}`);
            connectedPlayers.delete(playerKey);
            
            // Notify other players
            matchPlayers.forEach(otherPlayerKey => {
                if (otherPlayerKey !== playerKey) {
                    const otherPlayerSocket = connectedPlayers.get(otherPlayerKey);
                    if (otherPlayerSocket && otherPlayerSocket.readyState === 1) {
                        otherPlayerSocket.send(JSON.stringify({
                            type: 'disconnect',
                            message: `${username} disconnected`
                        }));
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error in simple remote game:', error);
        if (connection.socket && connection.socket.readyState === 1) {
            connection.socket.close(1011, 'Internal server error');
        }
    }
});

console.log('🔌 Simple remote game route registered');
console.log('Routes registered successfully');
console.log('🔌 All routes registered successfully');

// setupGracefulShutdown(fastify, prisma);

// 🔹 Start server LAST
try {
    setupGracefulShutdown(fastify, prisma);
  console.log('Attempting to start server...');
  const address = await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log(`Server running at ${address}`);
  
  // Create WebSocket server for remote game
  const wss = new WebSocketServer({ port: 3001 });
  
  wss.on('connection', (ws, request) => {
    console.log('🔌 WebSocket connection established!');
    const url = new URL(request.url, 'http://localhost:3001');
    const path = url.pathname;
    
    // Handle AI game WebSocket connection
    if (path === '/ai-game') {
      console.log('🤖 AI Game WebSocket connection');
      handleAIGame(ws, request);
      return;
    }
    
    const matchId = path.split('/').pop();
    const username = url.searchParams.get('username') || 'Anonymous';
    
    console.log('📝 Player connected:', { matchId, username });
    
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
          handlePlayerInput(matchId, playerNumber, data.inputType, data.key);
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
  });
  
  console.log('🔌 WebSocket server started on port 3001');
  console.log('✅ Server started successfully');
} catch (err) {
  console.error("Server startup error:", err);
  fastify.log.error("catched in server => ", err);
  process.exit(1);
}

// 🔹 After server boot, safe to use secrets or configs
const secrets = await getSecrets();
const jwtSecret = secrets.JWT_SECRET;
const dbPassword = secrets.DB_PASSWORD;

// Track players who want to play again
const playAgainRequests = new Map();

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
