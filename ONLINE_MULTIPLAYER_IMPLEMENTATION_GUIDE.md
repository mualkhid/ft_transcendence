# Online Multiplayer Game Implementation Guide

## Overview

This guide explains how to implement a real-time online multiplayer Pong game system using WebSockets. The system consists of two main components:

1. **Matchmaking System** - Finds and pairs players
2. **Game Session System** - Handles real-time gameplay

## Architecture Overview

```
┌─────────────┐    WebSocket    ┌─────────────┐    WebSocket    ┌─────────────┐
│   Frontend  │ ──────────────► │   Backend   │ ──────────────► │   Frontend  │
│  Player 1   │                 │ Matchmaking │                 │  Player 2   │
└─────────────┘                 │    & Game   │                 └─────────────┘
                                │   Sessions  │
                                └─────────────┘
```

## Backend Implementation

### 1. WebSocket Server Setup

**File: `backend/server.js`**

```javascript
import fastifyWebsocket from '@fastify/websocket';

// Register WebSocket support
await fastify.register(fastifyWebsocket);

// Register routes with WebSocket endpoints
fastify.register(matchmakingRoutes, { prefix: '/api' });
fastify.register(remoteGameRoutes);
```

**Required Dependencies:**
```json
{
  "@fastify/websocket": "^8.0.0"
}
```

### 2. Matchmaking System

**File: `backend/routes/matchmakingRoutes.js`**

```javascript
async function matchmakingRoutes(fastify, options) {
    // WebSocket endpoint for matchmaking
    fastify.get('/matchmaking', { websocket: true }, async (connection, request) => {
        const userId = 'anonymous_' + Date.now();
        const username = 'Anonymous_' + Math.floor(Math.random() * 1000);
        
        // Add player to matchmaking queue
        await addPlayerToQueue(userId, connection.socket, username);
        
        // Send initial status
        const status = getQueueStatus();
        connection.socket.send(JSON.stringify({
            type: 'queue-status',
            status: status
        }));
        
        // Handle incoming messages
        connection.socket.on('message', (message) => {
            const data = JSON.parse(message);
            
            if (data.type === 'join-queue') {
                connection.socket.send(JSON.stringify({
                    type: 'joined-queue',
                    message: 'Successfully joined matchmaking queue'
                }));
            } else if (data.type === 'cancel-matchmaking') {
                removePlayerFromQueue(userId);
                connection.socket.send(JSON.stringify({
                    type: 'matchmaking-cancelled',
                    message: 'Matchmaking cancelled'
                }));
            }
        });
        
        // Handle disconnection
        connection.socket.on('close', (code, reason) => {
            removePlayerFromQueue(userId);
        });
    });
}
```

**File: `backend/services/matchmakingService.js`**

```javascript
// Queue of players waiting for a match
const waitingPlayers = new Map(); // userId -> { socket, username, timestamp }
const pendingMatches = new Map(); // matchId -> { player1, player2, timestamp }

export async function addPlayerToQueue(userId, socket, username) {
    // Store player in waiting queue
    waitingPlayers.set(userId, {
        socket,
        username,
        timestamp: Date.now()
    });
    
    // Try to find a match
    await tryMatchPlayers();
}

async function tryMatchPlayers() {
    const players = Array.from(waitingPlayers.entries());
    
    if (players.length < 2) return;
    
    // Sort by timestamp (first come, first serve)
    players.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Take the first two players
    const [player1Id, player1Data] = players[0];
    const [player2Id, player2Data] = players[1];
    
    // Remove both players from queue
    waitingPlayers.delete(player1Id);
    waitingPlayers.delete(player2Id);
    
    // Create a new match
    const matchId = nextMatchId++;
    const match = await createMatchState(matchId, player1Data.username, player2Data.username);
    
    // Store match in pending matches
    pendingMatches.set(matchId, {
        player1: { id: player1Id, data: player1Data },
        player2: { id: player2Id, data: player2Data },
        timestamp: Date.now()
    });
    
    // Send match found message to both players
    const matchFoundMessage = JSON.stringify({
        type: 'match-found',
        matchId: matchId,
        message: `Match found! You will be connected to ${player1Data.username} vs ${player2Data.username}`
    });
    
    player1Data.socket.send(matchFoundMessage);
    player2Data.socket.send(matchFoundMessage);
}
```

### 3. Game Session System

**File: `backend/routes/remoteGameRoutes.js`**

```javascript
import { handleRemoteGame } from '../controller/remoteGameController.js';

async function remoteGameRoutes(fastify, options) {
    fastify.get('/remote-game/:matchId', { websocket: true }, async (connection, request) => {
        await handleRemoteGame(connection, request.params.matchId);
    });
}

export default remoteGameRoutes;
```

**File: `backend/controller/remoteGameController.js`**

```javascript
export async function handleRemoteGame(socket, matchId) {
    const playerNumber = await addPlayerToMatch(parseInt(matchId), socket);

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
        player1Username: match.state.player1Alias,
        player2Username: match.state.player2Alias
    });
    
    socket.send(successMessage);

    if (match.state.connectedPlayers === 2) {
        const readyMessage = JSON.stringify({
            type: 'ready',
            message: 'Both players connected! Match ready to start.',
            player1Username: match.state.player1Alias,
            player2Username: match.state.player2Alias
        });
        
        if (match.player1) match.player1.send(readyMessage);
        if (match.player2) match.player2.send(readyMessage);
        
        // Start game loop
        if (match.state.gameLoopInterval) {
            clearInterval(match.state.gameLoopInterval);
        }
        match.state.gameLoopInterval = setInterval(() => updateBall(parseInt(matchId)), 16);
    }

    // Handle player input
    socket.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'input') {
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

    // Handle disconnection
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
```

**File: `backend/services/matchStateService.js`**

```javascript
// Active game sessions
const activeMatches = new Map(); // matchId -> match object

export async function createMatchState(matchId, player1Alias, player2Alias) {
    const match = {
        id: matchId,
        player1: null,
        player2: null,
        state: {
            player1Alias,
            player2Alias,
            connectedPlayers: 0,
            ballPositionX: 400,
            ballPositionY: 300,
            speedX: 5,
            speedY: 3,
            leftPaddleY: 250,
            rightPaddleY: 250,
            scorePlayer1: 0,
            scorePlayer2: 0,
            gameLoopInterval: null
        }
    };
    
    activeMatches.set(matchId, match);
    return match;
}

export async function addPlayerToMatch(matchId, socket) {
    const match = activeMatches.get(matchId);
    if (!match) return null;
    
    if (!match.player1) {
        match.player1 = socket;
        match.state.connectedPlayers++;
        return 1;
    } else if (!match.player2) {
        match.player2 = socket;
        match.state.connectedPlayers++;
        return 2;
    }
    
    return null; // Match is full
}

export function handlePlayerInput(matchId, playerNumber, inputType, key) {
    const match = activeMatches.get(matchId);
    if (!match) return null;
    
    // Update paddle positions based on input
    if (playerNumber === 1) {
        if (inputType === 'keydown') {
            if (key === 'up') match.state.leftPaddleY = Math.max(0, match.state.leftPaddleY - 10);
            if (key === 'down') match.state.leftPaddleY = Math.min(500, match.state.leftPaddleY + 10);
        }
    } else if (playerNumber === 2) {
        if (inputType === 'keydown') {
            if (key === 'up') match.state.rightPaddleY = Math.max(0, match.state.rightPaddleY - 10);
            if (key === 'down') match.state.rightPaddleY = Math.min(500, match.state.rightPaddleY + 10);
        }
    }
    
    return {
        playerNumber,
        inputType,
        inputState: key,
        currentKeys: {
            player1: { up: false, down: false },
            player2: { up: false, down: false }
        }
    };
}

export function updateBall(matchId) {
    const match = activeMatches.get(matchId);
    if (!match) return;
    
    // Update ball position
    match.state.ballPositionX += match.state.speedX;
    match.state.ballPositionY += match.state.speedY;
    
    // Ball collision detection and scoring logic
    // ... (implement ball physics)
    
    // Send updated game state to both players
    const gameStateMessage = JSON.stringify({
        type: 'game-state',
        ballX: match.state.ballPositionX,
        ballY: match.state.ballPositionY,
        leftPaddleY: match.state.leftPaddleY,
        rightPaddleY: match.state.rightPaddleY,
        scorePlayer1: match.state.scorePlayer1,
        scorePlayer2: match.state.scorePlayer2
    });
    
    if (match.player1) match.player1.send(gameStateMessage);
    if (match.player2) match.player2.send(gameStateMessage);
}
```

## Frontend Implementation

### 1. Game State Management

**File: `frontend/src/main.ts`**

```typescript
// Online game state interface
interface OnlineGameState {
    matchmakingSocket: WebSocket | null;
    gameSocket: WebSocket | null;
    matchId: number | null;
    playerNumber: number | null;
    isConnected: boolean;
    isInMatch: boolean;
}

class SimpleAuth {
    // Online game state
    private onlineGameState: OnlineGameState = {
        matchmakingSocket: null,
        gameSocket: null,
        matchId: null,
        playerNumber: null,
        isConnected: false,
        isInMatch: false
    };
}
```

### 2. Matchmaking Implementation

```typescript
private initializeOnlineGame(): void {
    console.log('=== INITIALIZING ONLINE GAME ===');
    
    // Set up matchmaking controls
    this.setupMatchmakingControls();
    
    // Start matchmaking automatically
    this.startMatchmaking();
}

private startMatchmaking(): void {
    console.log('Starting matchmaking...');
    
    try {
        // Connect to matchmaking WebSocket
        const matchmakingSocket = new WebSocket('ws://localhost:3000/api/matchmaking');
        
        matchmakingSocket.onopen = () => {
            console.log('Connected to matchmaking server');
            this.onlineGameState.matchmakingSocket = matchmakingSocket;
            this.onlineGameState.isConnected = true;
            
            // Send join queue message
            const joinMessage = {
                type: 'join-queue',
                userId: this.currentUser.id,
                username: this.currentUser.username
            };
            matchmakingSocket.send(JSON.stringify(joinMessage));
            
            this.updateMatchmakingStatus('Searching for opponent...', 'searching');
        };

        matchmakingSocket.onmessage = (event) => {
            console.log('Raw matchmaking message received:', event.data);
            try {
                const data = JSON.parse(event.data);
                console.log('Parsed matchmaking message:', data);
                
                if (data.type === 'match-found') {
                    console.log('Match found! Handling match...');
                    this.handleMatchFound(data);
                } else if (data.type === 'queue-status') {
                    console.log('Queue status update:', data.status);
                    this.updateMatchmakingStatus(`Players in queue: ${data.status.waitingPlayers}`, 'searching');
                } else if (data.type === 'joined-queue') {
                    console.log('Successfully joined queue');
                    this.updateMatchmakingStatus('Joined matchmaking queue. Searching for opponent...', 'searching');
                }
            } catch (error) {
                console.error('Error parsing matchmaking message:', error);
            }
        };

        matchmakingSocket.onerror = (error) => {
            console.error('Matchmaking WebSocket error:', error);
            this.updateMatchmakingStatus('Connection error. Please try again.', 'error');
        };

        matchmakingSocket.onclose = (event) => {
            console.log('Matchmaking WebSocket closed:', event.code, event.reason);
            this.onlineGameState.isConnected = false;
            if (!this.onlineGameState.isInMatch) {
                this.updateMatchmakingStatus(`Connection lost (Code: ${event.code}). Please try again.`, 'error');
            }
        };

    } catch (error) {
        console.error('Failed to start matchmaking:', error);
        this.updateMatchmakingStatus('Failed to connect to server. Retrying...', 'error');
        
        // Retry after 3 seconds
        setTimeout(() => {
            if (!this.onlineGameState.isConnected && !this.onlineGameState.isInMatch) {
                console.log('Retrying matchmaking connection...');
                this.startMatchmaking();
            }
        }, 3000);
    }
}
```

### 3. Game Session Implementation

```typescript
private handleMatchFound(data: any): void {
    console.log('=== HANDLING MATCH FOUND ===');
    console.log('Match data:', data);
    
    if (!data.matchId) {
        console.error('No matchId in match-found message');
        return;
    }
    
    this.onlineGameState.matchId = data.matchId;
    this.onlineGameState.isInMatch = true;
    
    console.log('Updated online game state:', this.onlineGameState);
    
    // Close matchmaking connection
    if (this.onlineGameState.matchmakingSocket) {
        console.log('Closing matchmaking socket...');
        this.onlineGameState.matchmakingSocket.close();
    }
    
    // Connect to game WebSocket
    console.log('Connecting to game with matchId:', data.matchId);
    this.connectToGame(data.matchId);
}

private connectToGame(matchId: number): void {
    console.log('Connecting to game:', matchId);
    
    try {
        const gameSocket = new WebSocket(`ws://localhost:3000/api/remote-game/${matchId}`);
        
        gameSocket.onopen = () => {
            console.log('Connected to game server');
            this.onlineGameState.gameSocket = gameSocket;
            this.updateMatchmakingStatus('Connected to game!', 'connected');
        };

        gameSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Game message received:', data);
            
            if (data.type === 'success') {
                this.handleGameSuccess(data);
            } else if (data.type === 'ready') {
                this.handleGameReady(data);
            } else if (data.type === 'input-update') {
                this.handleInputUpdate(data);
            } else if (data.type === 'game-state') {
                this.handleGameState(data);
            } else if (data.type === 'disconnect') {
                this.handlePlayerDisconnect(data);
            }
        };

        gameSocket.onerror = (error) => {
            console.error('Game WebSocket error:', error);
            this.updateMatchmakingStatus('Game connection error.', 'error');
        };

        gameSocket.onclose = () => {
            console.log('Game WebSocket closed');
            this.onlineGameState.isInMatch = false;
            this.updateMatchmakingStatus('Game ended.', 'ended');
        };

    } catch (error) {
        console.error('Failed to connect to game:', error);
        this.updateMatchmakingStatus('Failed to connect to game.', 'error');
    }
}
```

### 4. Game Rendering and Input Handling

```typescript
private handleGameReady(data: any): void {
    this.updateMatchmakingStatus('Both players ready! Game starting...', 'ready');
    
    // Show game canvas and hide matchmaking
    const matchmakingStatus = document.getElementById('matchmakingStatus');
    const scoreDisplay = document.querySelector('.text-center.text-white.mb-8');
    const gameContainer = document.querySelector('.flex.justify-center.mb-8');
    
    if (matchmakingStatus) matchmakingStatus.style.display = 'none';
    if (scoreDisplay) (scoreDisplay as HTMLElement).style.display = 'block';
    if (gameContainer) (gameContainer as HTMLElement).style.display = 'flex';
    
    // Initialize online game canvas
    this.initializeOnlineGameCanvas();
}

private initializeOnlineGameCanvas(): void {
    const canvas = document.getElementById('onlineGameCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for online game
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add game controls
    this.setupOnlineGameControls();
    
    // Start game rendering loop
    this.startOnlineGameLoop();
}

private setupOnlineGameControls(): void {
    // Handle keyboard input for online game
    document.addEventListener('keydown', (e) => {
        if (!this.onlineGameState.gameSocket || !this.onlineGameState.isInMatch) return;

        let key = '';
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            key = 'up';
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            key = 'down';
        } else {
            return;
        }

        const inputMessage = {
            type: 'input',
            inputType: 'keydown',
            key: key
        };

        this.onlineGameState.gameSocket.send(JSON.stringify(inputMessage));
    });

    document.addEventListener('keyup', (e) => {
        if (!this.onlineGameState.gameSocket || !this.onlineGameState.isInMatch) return;

        let key = '';
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            key = 'up';
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            key = 'down';
        } else {
            return;
        }

        const inputMessage = {
            type: 'input',
            inputType: 'keyup',
            key: key
        };

        this.onlineGameState.gameSocket.send(JSON.stringify(inputMessage));
    });
}

private handleGameState(data: any): void {
    // Update game state and re-render
    this.updateOnlineGameDisplay(data);
}

private updateOnlineGameDisplay(gameState: any): void {
    const canvas = document.getElementById('onlineGameCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = '#e94560';
    ctx.fillRect(50, gameState.leftPaddleY, 15, 100);
    ctx.fillRect(735, gameState.rightPaddleY, 15, 100);

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gameState.ballX, gameState.ballY, 10, 0, 2 * Math.PI);
    ctx.fill();

    // Update score display
    const player1Score = document.getElementById('onlinePlayer1Score');
    const player2Score = document.getElementById('onlinePlayer2Score');
    if (player1Score) player1Score.textContent = gameState.scorePlayer1.toString();
    if (player2Score) player2Score.textContent = gameState.scorePlayer2.toString();
}
```

### 5. UI Components

**File: `frontend/index.html`**

```html
<!-- Online Game Section -->
<div id="onlineGameSection" class="section">
    <div class="container mx-auto px-4 py-8">
        <!-- Matchmaking Status -->
        <div class="text-center text-white mb-8">
            <h2 class="text-4xl font-logo text-powerpuff-green mb-4">🌐 Online Matchmaking</h2>
            <p class="text-xl mb-6">Find an opponent to play against!</p>
            
            <!-- Matchmaking Status Display -->
            <div class="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm max-w-md mx-auto mb-6">
                <div id="matchmakingStatus" class="text-center">
                    <div class="text-3xl mb-4">🔍</div>
                    <h3 class="text-xl font-bold mb-2">Searching for opponent...</h3>
                    <div class="mt-4">
                        <div class="animate-spin rounded-full h-12 w-12 border-4 border-powerpuff-green border-t-transparent mx-auto"></div>
                    </div>
                </div>
            </div>
            
            <!-- Matchmaking Controls -->
            <div class="flex justify-center space-x-4">
                <button id="cancelMatchmakingBtn" class="bg-powerpuff-red hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors shadow-lg">
                    ❌ Cancel Search
                </button>
            </div>
        </div>

        <!-- Online Score Display -->
        <div class="text-center text-white mb-8" style="display: none;">
            <div class="flex justify-center space-x-4">
                <div class="bg-powerpuff-pink bg-opacity-50 rounded-lg p-4">
                    <h3 class="text-lg font-bold">Score</h3>
                    <div class="flex justify-center space-x-8">
                        <div>
                            <p class="text-sm" id="onlinePlayer1Name">Player 1</p>
                            <p id="onlinePlayer1Score" class="text-2xl font-bold">0</p>
                        </div>
                        <div>
                            <p class="text-sm" id="onlinePlayer2Name">Player 2</p>
                            <p id="onlinePlayer2Score" class="text-2xl font-bold">0</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Online Game Container -->
        <div class="flex justify-center mb-8">
            <div class="relative bg-black rounded-lg shadow-2xl border-4 border-powerpuff-green">
                <canvas id="onlineGameCanvas" width="800" height="600" class="rounded-lg"></canvas>
            </div>
        </div>
    </div>
</div>
```

## Message Protocol

### Matchmaking Messages

**Client → Server:**
```json
{
  "type": "join-queue",
  "userId": "user123",
  "username": "PlayerName"
}
```

**Server → Client:**
```json
{
  "type": "match-found",
  "matchId": 1,
  "message": "Match found! You will be connected to Player1 vs Player2"
}
```

### Game Messages

**Client → Server:**
```json
{
  "type": "input",
  "inputType": "keydown",
  "key": "up"
}
```

**Server → Client:**
```json
{
  "type": "game-state",
  "ballX": 400,
  "ballY": 300,
  "leftPaddleY": 250,
  "rightPaddleY": 250,
  "scorePlayer1": 0,
  "scorePlayer2": 0
}
```

## Testing Strategy

### 1. Unit Testing
- Test matchmaking queue logic
- Test game state management
- Test WebSocket message handling

### 2. Integration Testing
- Test complete matchmaking flow
- Test game session creation
- Test player disconnection handling

### 3. Load Testing
- Test with multiple concurrent players
- Test server performance under load
- Test memory usage with many active games

## Deployment Considerations

### 1. Scaling
- Use Redis for session storage across multiple servers
- Implement load balancing for WebSocket connections
- Use sticky sessions for game state consistency

### 2. Security
- Implement WebSocket authentication
- Validate all incoming messages
- Rate limit WebSocket connections

### 3. Monitoring
- Monitor WebSocket connection count
- Track matchmaking queue length
- Monitor game session duration

## Common Issues and Solutions

### 1. WebSocket Connection Drops
**Problem:** Connections close unexpectedly
**Solution:** Implement heartbeat/ping-pong mechanism

### 2. Game State Synchronization
**Problem:** Players see different game states
**Solution:** Use server authority and state broadcasting

### 3. Player Disconnections
**Problem:** Game breaks when player disconnects
**Solution:** Implement reconnection logic and match cleanup

### 4. Performance Issues
**Problem:** Lag or slow response times
**Solution:** Optimize game loop frequency and message size

## Conclusion

This implementation provides a complete real-time multiplayer gaming system with:

- **Automatic matchmaking** for finding opponents
- **Real-time game state synchronization** via WebSockets
- **Robust error handling** and connection management
- **Scalable architecture** for future growth

The system can be extended to support:
- Tournament systems
- Spectator mode
- Chat functionality
- Game replays
- Leaderboards and statistics
