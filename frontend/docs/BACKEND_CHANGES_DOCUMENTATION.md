# Backend Changes Documentation

## Overview
This document details all the backend changes made to implement the 1v1 local game and online multiplayer game functionality for the Powerpuff Girls Pong application.

## 1. Server Configuration Changes

### File: `backend/server.js`

**Changes Made:**
- Added WebSocket support with `fastifyWebsocket`
- Registered matchmaking routes: `fastify.register(matchmakingRoutes, { prefix: '/api' })`
- Registered remote game routes: `fastify.register(remoteGameRoutes)` (without prefix)
- Disabled helmet CSP for WebSocket compatibility
- Added rate limiting with WebSocket exception

**Routes Available:**
- **Matchmaking**: `ws://localhost:3000/api/matchmaking`
- **Remote Game**: `ws://localhost:3000/api/remote-game/:matchId`

## 2. Matchmaking System

### File: `backend/routes/matchmakingRoutes.js`

**Purpose**: Handles player queue management and match creation

**Key Features:**
- WebSocket endpoint for real-time matchmaking
- First-come-first-serve queue system
- Anonymous user handling (temporary)
- Queue status updates
- Match cancellation support

**Message Types:**
- `join-queue`: Player joins matchmaking queue
- `cancel-matchmaking`: Player cancels matchmaking
- `ping/pong`: Keep-alive messages
- `queue-status`: Current queue information
- `match-found`: Match created notification

**Recent Fixes:**
- Added proper response to `join-queue` messages
- Enhanced error handling to prevent WebSocket closure
- Added detailed logging for debugging
- Added WebSocket error event handlers

### File: `backend/services/matchmakingService.js`

**Purpose**: Core matchmaking logic and queue management

**Key Functions:**
- `addPlayerToQueue(userId, socket, username)`: Adds player to waiting queue
- `removePlayerFromQueue(userId)`: Removes player from queue
- `tryMatchPlayers()`: Matches first two players in queue
- `getQueueStatus()`: Returns current queue statistics

**Data Structures:**
- `waitingPlayers`: Map of userId -> { socket, username, timestamp }
- `pendingMatches`: Map of matchId -> { player1, player2, timestamp }

**Match Creation Process:**
1. Player connects to matchmaking WebSocket
2. Player added to waiting queue
3. When 2+ players in queue, first two are matched
4. Match state created via `createMatchState()`
5. Both players receive `match-found` message with matchId

## 3. Remote Game System

### File: `backend/routes/remoteGameRoutes.js`

**Purpose**: WebSocket endpoint for actual game play

**Route**: `/remote-game/:matchId`
- Handles WebSocket connections for specific matches
- Delegates to `handleRemoteGame()` controller

### File: `backend/controller/remoteGameController.js`

**Purpose**: Manages individual game sessions and player connections

**Key Features:**
- Player assignment (Player 1 or Player 2)
- Real-time game state synchronization
- Input handling and validation
- Game loop management
- Disconnection handling

**Message Types:**
- `player-ready`: Player indicates readiness
- `input`: Player input (keydown/keyup, up/down)
- `input-update`: Game state updates
- `success`: Player assignment confirmation
- `ready`: Both players ready notification
- `error`: Error messages
- `disconnect`: Player disconnection notification

**Recent Enhancements:**
- Added username support in success/ready messages
- Enhanced error handling and validation
- Improved disconnection handling

### File: `backend/services/matchStateService.js`

**Purpose**: Manages game state for individual matches

**Key Functions:**
- `createMatchState(matchId, player1Alias, player2Alias)`: Creates new match
- `addPlayerToMatch(matchId, websocket)`: Adds player to existing match
- `removePlayerFromMatch(matchId, websocket)`: Removes player from match
- `handlePlayerInput(matchId, playerNumber, inputType, key)`: Processes player input
- `updateBall(matchId)`: Updates ball position and collision detection

**Game State Structure:**
```javascript
{
  player1: WebSocket,
  player2: WebSocket,
  matchId: number,
  state: {
    status: 'waiting' | 'playing' | 'finished',
    connectedPlayers: number,
    player1Keys: { up: boolean, down: boolean },
    player2Keys: { up: boolean, down: boolean },
    ballPositionX: number,
    ballPositionY: number,
    speedX: number,
    speedY: number,
    radius: number,
    canvasHeight: number,
    leftPaddleX: number,
    leftPaddleY: number,
    rightPaddleX: number,
    rightPaddleY: number,
    paddleWidth: number,
    paddleHeight: number,
    canvasWidth: number,
    scorePlayer1: number,
    scorePlayer2: number,
    maxScore: number,
    gameLoopInterval: number,
    matchStarted: boolean,
    player1Alias: string,
    player2Alias: string
  }
}
```

## 4. Database Integration

### File: `backend/services/matchDatabaseService.js`

**Purpose**: Database operations for match tracking

**Key Functions:**
- `createCasualMatch(player1Alias, player2Alias, matchId)`: Creates match record
- `startMatch(matchId)`: Marks match as started
- `completeMatch(matchId, winnerId)`: Marks match as completed

## 5. Authentication Integration

### Current Status: PARTIALLY IMPLEMENTED

**Issues Identified:**
- WebSocket connections use anonymous users instead of authenticated users
- JWT tokens are received but not validated in WebSocket context
- User information is not properly extracted from authentication tokens

**Missing Implementation:**
- WebSocket authentication middleware
- User token validation in WebSocket connections
- Proper user ID and username extraction from JWT tokens

**Current Workaround:**
- Uses anonymous user IDs (`anonymous_${timestamp}`)
- Uses random usernames (`Anonymous_${random}`)
- Backend logs show JWT tokens are received but not processed

## 6. Error Handling and Logging

### Enhanced Logging:
- WebSocket connection events
- Matchmaking queue updates
- Player matching events
- Game state changes
- Error conditions with detailed information

### Error Handling:
- WebSocket connection errors
- Message parsing errors
- Invalid input validation
- Player disconnection handling
- Match state validation

## 7. Missing Components

### 1. WebSocket Authentication
**Status**: NOT IMPLEMENTED
**Impact**: Players appear as "Anonymous" instead of real usernames
**Solution Needed**: Implement JWT validation in WebSocket connections

### 2. Game State Persistence
**Status**: PARTIALLY IMPLEMENTED
**Missing**: Game result storage and statistics updates
**Impact**: Game results not saved to database

### 3. Real-time Score Updates
**Status**: IMPLEMENTED
**Functionality**: Working correctly

### 4. Player Disconnection Recovery
**Status**: BASIC IMPLEMENTATION
**Missing**: Reconnection logic and match state recovery

## 8. Testing Status

### Working Features:
✅ WebSocket connections
✅ Matchmaking queue
✅ Player matching
✅ Game state synchronization
✅ Real-time input handling
✅ Basic disconnection handling

### Issues Found:
❌ WebSocket closes with code 1006 (partially fixed)
❌ Anonymous user names (authentication issue)
❌ Frontend not receiving match-found messages (partially fixed)

## 9. Performance Considerations

### Current Implementation:
- In-memory game state storage
- Real-time WebSocket communication
- 60 FPS game loop (16ms intervals)
- First-come-first-serve queue system

### Scalability Notes:
- Single server instance
- No load balancing
- No horizontal scaling support
- Memory-based state (not persistent)

## 10. Security Considerations

### Implemented:
- CORS configuration
- Rate limiting (with WebSocket exceptions)
- Input validation
- Error handling

### Missing:
- WebSocket authentication
- User session validation
- Anti-cheat measures
- Input sanitization

## Summary

The backend implementation provides a solid foundation for both 1v1 local games and online multiplayer functionality. The core systems are working, but the main missing piece is proper WebSocket authentication to use real user information instead of anonymous users.

**Priority Fixes Needed:**
1. Implement WebSocket JWT authentication
2. Fix WebSocket connection stability issues
3. Add proper user session management
4. Implement game result persistence

**Working Systems:**
- Matchmaking queue and matching
- Real-time game state synchronization
- Input handling and validation
- Basic error handling and logging
