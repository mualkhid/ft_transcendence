# Power-ups Implementation Guide

## Overview
This document explains how power-ups were implemented in the Powerpuff Pong game and provides guidance for implementing them in remote multiplayer games.

## Current Implementation Status

### ✅ Working Game Modes
- **1v1 Local Games**: Power-ups fully implemented
- **AI Games**: Power-ups fully implemented  
- **Tournament Games**: Power-ups fully implemented (uses local game system)

### ❌ Not Working
- **Remote Multiplayer Games**: Power-ups not implemented (server-side required)

## How Power-ups Were Implemented (Local Games)

### 1. Frontend Game State
Power-ups are stored in the local game state:

```typescript
// In gameState object
powerUps: [] as Array<{
    x: number, y: number, width: number, height: number,
    type: 'point', active: boolean, duration: number,
    speedX: number, speedY: number
}>,
powerUpSpawnTimer: 0,
powerUpsSpawned: 0,
maxPowerUpsPerGame: 2,
powerupsEnabled: true // Controlled by toggle
```

### 2. UI Toggle Implementation
Each game mode has a power-ups toggle:

```html
<!-- Example for 1v1 game -->
<div class="mb-8">
    <label class="flex items-center space-x-3">
        <input type="checkbox" id="powerupsToggle1v1" class="w-5 h-5">
        <span class="text-white">Enable Power-ups</span>
    </label>
    <div id="powerupsStatus1v1" class="text-sm text-gray-300 mt-1"></div>
</div>
```

### 3. Toggle Setup and Event Handling
```typescript
private setupPowerupsToggleForElement(toggle: HTMLInputElement, status: HTMLElement, gameMode: string): void {
    // Load saved preference from localStorage
    const savedPowerupsEnabled = localStorage.getItem(`powerupsEnabled_${gameMode}`);
    const powerupsEnabled = savedPowerupsEnabled !== null ? savedPowerupsEnabled === 'true' : true;
    
    // Set initial state
    toggle.checked = powerupsEnabled;
    this.updatePowerupsStatusForElement(status, powerupsEnabled);
    
    // Add event listener for toggle changes
    toggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const enabled = target.checked;
        
        // Save preference to localStorage
        localStorage.setItem(`powerupsEnabled_${gameMode}`, enabled.toString());
        
        // Update game state immediately if it exists
        if (this.gameState) {
            this.gameState.powerupsEnabled = enabled;
        }
    });
}
```

### 4. Game Loop Integration
Power-ups are updated in the main game loop:

```typescript
// In updateGame() function
private updateGame(): void {
    // ... other game logic ...
    
    // Check power-ups (improved system: ball collision, duration, scoring)
    this.updatePowerUps();
    
    // Draw the game
    this.drawGame();
}
```

### 5. Power-ups Logic
```typescript
private updatePowerUps(): void {
    // Check if power-ups are enabled
    if (!this.gameState.powerupsEnabled) {
        return;
    }
    
    // Spawn power-ups (max 2 per game total)
    if (this.gameState.powerUpsSpawned < this.gameState.maxPowerUpsPerGame && 
        this.gameState.powerUps.length === 0 && 
        Math.random() < 0.1) { // 10% chance per frame
        this.spawnPowerUp();
    }
    
    // Update existing power-ups (decrease duration, remove expired)
    this.gameState.powerUps = this.gameState.powerUps.filter((powerUp: any) => {
        powerUp.duration--;
        return powerUp.duration > 0;
    });
    
    // Check ball collision with power-ups
    this.gameState.powerUps.forEach((powerUp: any, index: number) => {
        const ballX = this.gameState.ballPositionX;
        const ballY = this.gameState.ballPositionY;
        
        // Check collision
        if (ballX + this.gameState.radius > powerUp.x && 
            ballX - this.gameState.radius < powerUp.x + powerUp.width &&
            ballY + this.gameState.radius > powerUp.y && 
            ballY - this.gameState.radius < powerUp.y + powerUp.height) {
            
            // Determine which player gets the point
            const player1GetsPoint = ballX < this.gameState.canvasWidth / 2;
            
            if (player1GetsPoint) {
                this.gameState.scorePlayer1++;
            } else {
                this.gameState.scorePlayer2++;
            }
            
            // Remove power-up
            this.gameState.powerUps.splice(index, 1);
            
            console.log(`Power-up collected! Player ${player1GetsPoint ? '1' : '2'} gets a point!`);
        }
    });
}

private spawnPowerUp(): void {
    const powerUp = {
        x: Math.random() * (this.gameState.canvasWidth - 30),
        y: Math.random() * (this.gameState.canvasHeight - 30),
        width: 25,
        height: 25,
        speedX: 0,
        speedY: 0,
        type: 'point' as 'point',
        active: true,
        duration: 600 // 10 seconds at 60fps
    };
    
    this.gameState.powerUps.push(powerUp);
    this.gameState.powerUpsSpawned++;
    console.log(`Spawned power-up square at (${powerUp.x}, ${powerUp.y}) - ${this.gameState.powerUpsSpawned}/${this.gameState.maxPowerUpsPerGame}`);
}
```

### 6. Rendering
Power-ups are drawn in the game canvas:

```typescript
// In drawGame() function
this.gameState.powerUps.forEach((powerUp: any) => {
    // Draw square power-up with Powerpuff colors
    const colors = ['#FF69B4', '#87CEEB', '#98FB98']; // Pink, Blue, Green
    const color = colors[this.gameState.powerUpsSpawned % colors.length];
    
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    ctx.restore();
});
```

## How to Implement Power-ups in Remote Games

### The Challenge
Remote games are fundamentally different from local games:
- **Local Games**: Frontend runs game loop → calls `updatePowerUps()` → power-ups work
- **Remote Games**: Server runs game loop → sends `game-state` messages → frontend just displays

### Required Backend Changes

#### 1. Update Match State Service (`backend/services/matchStateService.js`)

Add power-ups state to the game state:

```javascript
// In createMatchState function
const matchState = {
    // ... existing state ...
    state: {
        // ... existing game state ...
        
        // Power-ups state
        powerUps: [],
        powerUpsSpawned: 0,
        maxPowerUpsPerGame: 2,
        powerupsEnabled: true, // Default to enabled
        powerUpSpawnTimer: 0
    }
};
```

#### 2. Add Power-ups Logic to Game Update

```javascript
// In the game update function (where ball position is updated)
function updateGameState(matchState) {
    // ... existing ball and paddle logic ...
    
    // Update power-ups if enabled
    if (matchState.state.powerupsEnabled) {
        updatePowerUps(matchState);
    }
    
    // ... rest of game logic ...
}

function updatePowerUps(matchState) {
    const state = matchState.state;
    
    // Spawn power-ups (max 2 per game total)
    if (state.powerUpsSpawned < state.maxPowerUpsPerGame && 
        state.powerUps.length === 0 && 
        Math.random() < 0.1) { // 10% chance per frame
        spawnPowerUp(state);
    }
    
    // Update existing power-ups (decrease duration, remove expired)
    state.powerUps = state.powerUps.filter((powerUp) => {
        powerUp.duration--;
        return powerUp.duration > 0;
    });
    
    // Check ball collision with power-ups
    state.powerUps.forEach((powerUp, index) => {
        const ballX = state.ballPositionX;
        const ballY = state.ballPositionY;
        const radius = state.radius;
        
        // Check collision
        if (ballX + radius > powerUp.x && 
            ballX - radius < powerUp.x + powerUp.width &&
            ballY + radius > powerUp.y && 
            ballY - radius < powerUp.y + powerUp.height) {
            
            // Determine which player gets the point
            const player1GetsPoint = ballX < 400; // Canvas width / 2
            
            if (player1GetsPoint) {
                state.player1Score++;
            } else {
                state.player2Score++;
            }
            
            // Remove power-up
            state.powerUps.splice(index, 1);
            
            console.log(`Power-up collected! Player ${player1GetsPoint ? '1' : '2'} gets a point!`);
        }
    });
}

function spawnPowerUp(state) {
    const powerUp = {
        x: Math.random() * (800 - 30), // Canvas width - power-up width
        y: Math.random() * (600 - 30), // Canvas height - power-up height
        width: 25,
        height: 25,
        speedX: 0,
        speedY: 0,
        type: 'point',
        active: true,
        duration: 600 // 10 seconds at 60fps
    };
    
    state.powerUps.push(powerUp);
    state.powerUpsSpawned++;
    console.log(`Spawned power-up square at (${powerUp.x}, ${powerUp.y}) - ${state.powerUpsSpawned}/${state.maxPowerUpsPerGame}`);
}
```

#### 3. Update Game State Broadcasting

Make sure power-ups data is included in the `game-state` messages sent to clients:

```javascript
// In the function that sends game state to clients
function broadcastGameState(matchState) {
    const gameStateData = {
        type: 'game-state',
        ballX: matchState.state.ballPositionX,
        ballY: matchState.state.ballPositionY,
        speedX: matchState.state.speedX,
        speedY: matchState.state.speedY,
        leftPaddleY: matchState.state.leftPaddleY,
        rightPaddleY: matchState.state.rightPaddleY,
        player1Score: matchState.state.player1Score,
        player2Score: matchState.state.player2Score,
        
        // Add power-ups data
        powerUps: matchState.state.powerUps,
        powerUpsSpawned: matchState.state.powerUpsSpawned,
        maxPowerUpsPerGame: matchState.state.maxPowerUpsPerGame
    };
    
    // Send to both players
    if (matchState.player1) {
        matchState.player1.send(JSON.stringify(gameStateData));
    }
    if (matchState.player2) {
        matchState.player2.send(JSON.stringify(gameStateData));
    }
}
```

#### 4. Add Power-ups Toggle Support

Add a message type to handle power-ups toggle changes:

```javascript
// In the WebSocket message handler
case 'toggle-powerups':
    matchState.state.powerupsEnabled = data.enabled;
    console.log(`Power-ups ${data.enabled ? 'enabled' : 'disabled'} for match ${matchId}`);
    break;
```

### Required Frontend Changes

#### 1. Update Remote Game State

Add power-ups to the remote game state:

```typescript
// In onlineGameState
onlineGameState: {
    // ... existing state ...
    gameState: {
        // ... existing game state ...
        powerUps: [],
        powerUpsSpawned: 0,
        maxPowerUpsPerGame: 2
    }
}
```

#### 2. Handle Power-ups in Game State Messages

```typescript
// In the 'game-state' message handler
case 'game-state':
    // ... existing game state updates ...
    
    // Update power-ups data
    this.onlineGameState.gameState.powerUps = data.powerUps || [];
    this.onlineGameState.gameState.powerUpsSpawned = data.powerUpsSpawned || 0;
    this.onlineGameState.gameState.maxPowerUpsPerGame = data.maxPowerUpsPerGame || 2;
    
    // ... rest of handler ...
    break;
```

#### 3. Send Toggle Changes to Server

```typescript
// In the power-ups toggle event handler for remote games
toggle.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const enabled = target.checked;
    
    // Save preference to localStorage
    localStorage.setItem(`powerupsEnabled_online`, enabled.toString());
    
    // Send to server if connected
    if (this.onlineGameState.gameSocket && this.onlineGameState.gameSocket.readyState === WebSocket.OPEN) {
        this.onlineGameState.gameSocket.send(JSON.stringify({
            type: 'toggle-powerups',
            enabled: enabled
        }));
    }
});
```

#### 4. Render Power-ups in Remote Games

```typescript
// In the remote game drawing function
private drawRemoteGame(): void {
    const canvas = document.getElementById('remoteGameCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // ... existing drawing code ...
    
    // Draw power-ups
    this.onlineGameState.gameState.powerUps.forEach((powerUp: any) => {
        const colors = ['#FF69B4', '#87CEEB', '#98FB98']; // Pink, Blue, Green
        const color = colors[this.onlineGameState.gameState.powerUpsSpawned % colors.length];
        
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        ctx.restore();
    });
}
```

## Implementation Steps

### Phase 1: Backend Changes
1. Update `matchStateService.js` to include power-ups state
2. Add power-ups logic to the game update loop
3. Update game state broadcasting to include power-ups data
4. Add power-ups toggle message handling

### Phase 2: Frontend Changes
1. Update remote game state to include power-ups
2. Handle power-ups data in game-state messages
3. Send toggle changes to server
4. Render power-ups in remote game canvas

### Phase 3: Testing
1. Test power-ups spawning in remote games
2. Test power-ups collection and scoring
3. Test toggle functionality
4. Test with multiple concurrent games

## Key Differences Summary

| Aspect | Local Games | Remote Games |
|--------|-------------|--------------|
| **Game Loop** | Frontend (`setInterval`) | Backend (server loop) |
| **Power-ups Logic** | Frontend (`updatePowerUps()`) | Backend (server function) |
| **State Management** | Local `gameState` | Server `matchState` |
| **Toggle Handling** | Direct state update | WebSocket message to server |
| **Rendering** | Local canvas drawing | Receive data from server |

## Conclusion

Implementing power-ups in remote games requires significant backend changes because the game logic runs on the server, not the client. The frontend becomes a display client that receives game state updates rather than computing them locally.

The implementation follows the same logical structure as local games but moves the power-ups logic to the server-side game loop and uses WebSocket communication for toggle changes and state updates.
