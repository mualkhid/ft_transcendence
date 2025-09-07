# Powerpuff Girls Pong - Feature Documentation

## Table of Contents
1. [User Authentication](#user-authentication)
2. [Profile Management](#profile-management)
3. [Friends System](#friends-system)
4. [Game Features](#game-features)
5. [Tournament System](#tournament-system)
6. [Online Multiplayer](#online-multiplayer)
7. [Technical Implementation](#technical-implementation)

---

## User Authentication

### Registration Process
- **Frontend**: User fills out registration form with username, email, and password
- **Password Requirements**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Validation**: Real-time password strength checking with visual indicators (❌/✅)
- **Backend**: Password hashed using bcrypt before storing in database
- **Response**: JWT token stored in HTTP-only cookie, user redirected to home page

### Login Process
- **Frontend**: User enters username/email and password
- **Backend**: Validates credentials against hashed password in database
- **Authentication**: JWT token issued and stored in HTTP-only cookie
- **Session Management**: Token automatically included in subsequent requests
- **Error Handling**: Clear status messages for invalid credentials or network errors

### Logout Process
- **Frontend**: User clicks logout button in navigation
- **Backend**: Clears HTTP-only cookie containing JWT token
- **Session Cleanup**: Removes user data from frontend localStorage
- **Redirect**: User returned to login page

---

## Profile Management

### Username Change
**Frontend Implementation:**
```typescript
// Profile section in main.ts
private async handleUsernameChange(): Promise<void> {
    const newUsernameInput = document.getElementById('newUsername') as HTMLInputElement;
    const newUsername = newUsernameInput?.value.trim();

    if (!newUsername) {
        this.showStatus('Please enter a new username', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/profile/username', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username: newUsername })
        });

        if (response.ok) {
            const data = await response.json();
            this.currentUser = data.user;
            this.updateUserDisplay();
            this.showStatus('Username updated successfully!', 'success');
            newUsernameInput.value = '';
        } else {
            const errorData = await response.json();
            this.showStatus(errorData.error || 'Failed to update username', 'error');
        }
    } catch (error) {
        this.showStatus('Network error updating username', 'error');
    }
}
```

**Backend Implementation:**
```javascript
// profileController.js
const updateUsername = async (request, reply) => {
    try {
        const { username } = request.body;
        const userId = request.user.id;

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser && existingUser.id !== userId) {
            return reply.code(400).send({ error: 'Username already taken' });
        }

        // Update username
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { username },
            select: { id: true, username: true, email: true }
        });

        reply.send({ user: updatedUser });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to update username' });
    }
};
```

### Password Change
**Frontend Implementation:**
```typescript
private async handlePasswordChange(): Promise<void> {
    const currentPasswordInput = document.getElementById('currentPassword') as HTMLInputElement;
    const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;

    const currentPassword = currentPasswordInput?.value;
    const newPassword = newPasswordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        this.showStatus('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        this.showStatus('New passwords do not match', 'error');
        return;
    }

    // Password requirements validation
    const passwordRequirements = this.validatePassword(newPassword);
    if (!passwordRequirements.isValid) {
        this.showStatus('Password does not meet requirements', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/profile/password', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (response.ok) {
            this.showStatus('Password updated successfully!', 'success');
            // Clear form
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } else {
            const errorData = await response.json();
            this.showStatus(errorData.error || 'Failed to update password', 'error');
        }
    } catch (error) {
        this.showStatus('Network error updating password', 'error');
    }
}
```

**Backend Implementation:**
```javascript
const updatePassword = async (request, reply) => {
    try {
        const { currentPassword, newPassword } = request.body;
        const userId = request.user.id;

        // Get user with current password
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return reply.code(400).send({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        reply.send({ message: 'Password updated successfully' });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to update password' });
    }
};
```

### Avatar Upload
**Frontend Implementation:**
```typescript
private async handleAvatarUpload(): Promise<void> {
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
        this.showStatus('Please select an image file', 'error');
        return;
    }

    // File validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        this.showStatus('Please select a valid image file (JPEG, PNG, GIF)', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.showStatus('File size must be less than 5MB', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch('http://localhost:3000/api/profile/avatar', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            this.currentUser = data.user;
            this.updateUserDisplay();
            this.showStatus('Avatar updated successfully!', 'success');
            fileInput.value = '';
        } else {
            const errorData = await response.json();
            this.showStatus(errorData.error || 'Failed to upload avatar', 'error');
        }
    } catch (error) {
        this.showStatus('Network error uploading avatar', 'error');
    }
}
```

**Backend Implementation:**
```javascript
// Using @fastify/multipart for file uploads
const uploadAvatar = async (request, reply) => {
    try {
        const data = await request.file();
        const userId = request.user.id;

        if (!data) {
            return reply.code(400).send({ error: 'No file uploaded' });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(data.mimetype)) {
            return reply.code(400).send({ error: 'Invalid file type' });
        }

        // Generate unique filename
        const fileExtension = data.filename.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExtension}`;
        const filePath = `uploads/avatars/${fileName}`;

        // Save file
        await pump(data.file, fs.createWriteStream(filePath));

        // Update user avatar in database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: fileName },
            select: { id: true, username: true, email: true, avatar: true }
        });

        reply.send({ user: updatedUser });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to upload avatar' });
    }
};
```

---

## Friends System

### Search Users
**Frontend Implementation:**
```typescript
private async searchUsers(): Promise<void> {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchTerm = searchInput?.value.trim();

    if (!searchTerm) {
        this.showStatus('Please enter a search term', 'error');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/friends/search?q=${encodeURIComponent(searchTerm)}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const users = await response.json();
            this.displaySearchResults(users);
        } else {
            this.showStatus('Failed to search users', 'error');
        }
    } catch (error) {
        this.showStatus('Network error searching users', 'error');
    }
}
```

**Backend Implementation:**
```javascript
const searchUsers = async (request, reply) => {
    try {
        const { q } = request.query;
        const userId = request.user.id;

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                ],
                NOT: { id: userId } // Exclude current user
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true
            }
        });

        reply.send(users);
    } catch (error) {
        reply.code(500).send({ error: 'Failed to search users' });
    }
};
```

### Send Friend Request
**Frontend Implementation:**
```typescript
private async sendFriendRequest(userId: string): Promise<void> {
    try {
        const response = await fetch('http://localhost:3000/api/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId: userId })
        });

        if (response.ok) {
            this.showStatus('Friend request sent!', 'success');
            this.loadFriendRequests(); // Refresh requests list
        } else {
            const errorData = await response.json();
            this.showStatus(errorData.error || 'Failed to send friend request', 'error');
        }
    } catch (error) {
        this.showStatus('Network error sending friend request', 'error');
    }
}
```

**Backend Implementation:**
```javascript
const sendFriendRequest = async (request, reply) => {
    try {
        const { friendId } = request.body;
        const userId = request.user.id;

        // Check if request already exists
        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            }
        });

        if (existingRequest) {
            return reply.code(400).send({ error: 'Friend request already exists' });
        }

        // Create friend request
        await prisma.friendRequest.create({
            data: {
                senderId: userId,
                receiverId: friendId,
                status: 'PENDING'
            }
        });

        reply.send({ message: 'Friend request sent' });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to send friend request' });
    }
};
```

### Accept Friend Request
**Frontend Implementation:**
```typescript
private async acceptFriendRequest(requestId: string): Promise<void> {
    try {
        const response = await fetch(`http://localhost:3000/api/friends/accept/${requestId}`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            this.showStatus('Friend request accepted!', 'success');
            this.loadFriendRequests();
            this.loadFriendsList();
        } else {
            this.showStatus('Failed to accept friend request', 'error');
        }
    } catch (error) {
        this.showStatus('Network error accepting friend request', 'error');
    }
}
```

**Backend Implementation:**
```javascript
const acceptFriendRequest = async (request, reply) => {
    try {
        const { requestId } = request.params;
        const userId = request.user.id;

        // Update request status
        await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
        });

        reply.send({ message: 'Friend request accepted' });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to accept friend request' });
    }
};
```

### Decline Friend Request
**Frontend Implementation:**
```typescript
private async declineFriendRequest(requestId: string): Promise<void> {
    try {
        const response = await fetch(`http://localhost:3000/api/friends/decline/${requestId}`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            this.showStatus('Friend request declined', 'info');
            this.loadFriendRequests();
        } else {
            this.showStatus('Failed to decline friend request', 'error');
        }
    } catch (error) {
        this.showStatus('Network error declining friend request', 'error');
    }
}
```

**Backend Implementation:**
```javascript
const declineFriendRequest = async (request, reply) => {
    try {
        const { requestId } = request.params;

        // Delete the request
        await prisma.friendRequest.delete({
            where: { id: requestId }
        });

        reply.send({ message: 'Friend request declined' });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to decline friend request' });
    }
};
```

### Remove Friend
**Frontend Implementation:**
```typescript
private async removeFriend(friendId: string): Promise<void> {
    try {
        const response = await fetch(`http://localhost:3000/api/friends/remove/${friendId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            this.showStatus('Friend removed', 'info');
            this.loadFriendsList();
        } else {
            this.showStatus('Failed to remove friend', 'error');
        }
    } catch (error) {
        this.showStatus('Network error removing friend', 'error');
    }
}
```

**Backend Implementation:**
```javascript
const removeFriend = async (request, reply) => {
    try {
        const { friendId } = request.params;
        const userId = request.user.id;

        // Delete friend relationship
        await prisma.friendRequest.deleteMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ],
                status: 'ACCEPTED'
            }
        });

        reply.send({ message: 'Friend removed' });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to remove friend' });
    }
};
```

### Block User
**Frontend Implementation:**
```typescript
private async blockUser(userId: string): Promise<void> {
    try {
        const response = await fetch('http://localhost:3000/api/friends/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ blockedUserId: userId })
        });

        if (response.ok) {
            this.showStatus('User blocked', 'info');
            this.loadFriendsList();
        } else {
            this.showStatus('Failed to block user', 'error');
        }
    } catch (error) {
        this.showStatus('Network error blocking user', 'error');
    }
}
```

**Backend Implementation:**
```javascript
const blockUser = async (request, reply) => {
    try {
        const { blockedUserId } = request.body;
        const userId = request.user.id;

        // Create block relationship
        await prisma.userBlock.create({
            data: {
                blockerId: userId,
                blockedUserId: blockedUserId
            }
        });

        // Remove any existing friend relationship
        await prisma.friendRequest.deleteMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: blockedUserId },
                    { senderId: blockedUserId, receiverId: userId }
                ]
            }
        });

        reply.send({ message: 'User blocked' });
    } catch (error) {
        reply.code(500).send({ error: 'Failed to block user' });
    }
};
```

---

## Game Features

### Local 1v1 Game
- **Canvas-based rendering** with smooth animations
- **Paddle controls**: W/S keys for left player, Arrow keys for right player
- **Physics**: Ball collision detection with paddles and walls
- **Scoring**: First to 5 points wins
- **Game state management**: Proper initialization and cleanup

### AI Game Mode
- **AI opponent** with adjustable difficulty
- **Predictive ball tracking** for realistic gameplay
- **Score tracking** and win conditions

### Online Multiplayer
- **WebSocket connections** for real-time gameplay
- **Matchmaking system** for finding opponents
- **Synchronized game state** between players

---

## Tournament System

### Tournament Setup
- **Player count selection**: 4 or 8 players
- **Player name input**: Dynamic form generation with validation
- **Bracket generation**: Automatic tournament bracket creation
- **Match progression**: Automatic advancement through rounds

### Tournament Flow
1. **Setup**: Choose player count and enter names
2. **Bracket Display**: Visual tournament bracket with matchups
3. **Match Execution**: Individual game matches with proper scoring
4. **Results Tracking**: Winner advancement through bracket
5. **Tournament Completion**: Final champion determination

### Key Features
- **Automatic progression** between matches and rounds
- **Proper game integration** using existing 1v1 game logic
- **Clean UI** with only necessary buttons ("Start Game", "Next Match")
- **Comprehensive results** display with tournament summary

---

## Online Multiplayer

### Matchmaking System
**Frontend Implementation:**
```typescript
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
                username: this.currentUser.username
            };
            matchmakingSocket.send(JSON.stringify(joinMessage));
            
            this.updateMatchmakingStatus('Searching for opponent...', 'searching');
        };

        matchmakingSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Matchmaking message received:', data);
            
            if (data.type === 'match-found') {
                this.handleMatchFound(data);
            } else if (data.type === 'queue-status') {
                this.updateMatchmakingStatus(`Players in queue: ${data.status.waitingPlayers}`, 'searching');
            }
        };

        matchmakingSocket.onerror = (error) => {
            console.error('Matchmaking WebSocket error:', error);
            this.updateMatchmakingStatus('Connection error. Please try again.', 'error');
        };

        matchmakingSocket.onclose = () => {
            console.log('Matchmaking WebSocket closed');
            this.onlineGameState.isConnected = false;
            if (!this.onlineGameState.isInMatch) {
                this.updateMatchmakingStatus('Connection lost. Please try again.', 'error');
            }
        };

    } catch (error) {
        console.error('Failed to start matchmaking:', error);
        this.updateMatchmakingStatus('Failed to connect to server.', 'error');
    }
}
```

**Backend Implementation:**
```javascript
// matchmakingService.js
export async function addPlayerToQueue(userId, socket, username) {
    console.log(`Player ${username} (${userId}) added to matchmaking queue`);
    
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
    
    // Need at least 2 players to make a match
    if (players.length < 2) {
        console.log(`Not enough players in queue: ${players.length}`);
        return;
    }
    
    // Sort by timestamp (first come, first serve)
    players.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Take the first two players
    const [player1Id, player1Data] = players[0];
    const [player2Id, player2Data] = players[1];
    
    console.log(`Matching players: ${player1Data.username} vs ${player2Data.username}`);
    
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
    
    console.log(`Match ${matchId} created for ${player1Data.username} vs ${player2Data.username}`);
}
```

### Real-time Game Connection
**Frontend Implementation:**
```typescript
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

**Backend Implementation:**
```javascript
// remoteGameController.js
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
        
        if (match.state.gameLoopInterval) {
            clearInterval(match.state.gameLoopInterval);
        }
        match.state.gameLoopInterval = setInterval(() => updateBall(parseInt(matchId)), 16);
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

### Key Features
- **Automatic matchmaking**: Players join queue and are matched automatically
- **Real-time WebSocket communication**: Instant game state synchronization
- **Player assignment**: Automatic player 1/2 assignment
- **Input handling**: Real-time paddle movement synchronization
- **Disconnection handling**: Graceful handling of player disconnections
- **Game state management**: Centralized game state for each match

### User Experience
- **Matchmaking status**: Real-time updates on queue position and match status
- **Connection feedback**: Clear status messages for connection states
- **Game controls**: Standard W/S and Arrow key controls
- **Visual feedback**: Loading animations and status indicators
- **Error handling**: Comprehensive error messages and recovery options

---

## Technical Implementation

### Frontend Architecture
- **TypeScript** for type safety and better development experience
- **Tailwind CSS** for styling with utility classes
- **Modular design** with separate sections for different features
- **State management** using localStorage and class properties
- **Event-driven architecture** with proper event listener management

### Backend Architecture
- **Node.js** with Fastify framework for high performance
- **Prisma ORM** for database operations
- **SQLite database** for data persistence
- **JWT authentication** with HTTP-only cookies
- **File upload handling** with multipart support
- **CORS configuration** for cross-origin requests

### Database Schema
```sql
-- Users table
CREATE TABLE User (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Friend requests table
CREATE TABLE FriendRequest (
    id TEXT PRIMARY KEY,
    senderId TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES User(id),
    FOREIGN KEY (receiverId) REFERENCES User(id)
);

-- User blocks table
CREATE TABLE UserBlock (
    id TEXT PRIMARY KEY,
    blockerId TEXT NOT NULL,
    blockedUserId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blockerId) REFERENCES User(id),
    FOREIGN KEY (blockedUserId) REFERENCES User(id)
);
```

### Security Features
- **Password hashing** using bcrypt with salt rounds
- **JWT token validation** on protected routes
- **Input validation** on both frontend and backend
- **File upload restrictions** (type and size limits)
- **SQL injection prevention** through Prisma ORM
- **XSS protection** through proper input sanitization

### Error Handling
- **Comprehensive error messages** for user feedback
- **Network error handling** with retry mechanisms
- **Validation errors** with specific field highlighting
- **Graceful degradation** when features are unavailable

---

## User Experience Features

### Status Messages
- **Consistent notification system** replacing browser alerts
- **Color-coded messages**: Success (green), Error (red), Info (blue)
- **Auto-dismissing** notifications with smooth animations
- **Non-intrusive design** that doesn't block user interaction

### Responsive Design
- **Mobile-friendly** interface with responsive layouts
- **Touch-friendly** controls for mobile devices
- **Adaptive sizing** for different screen sizes
- **Consistent styling** across all devices

### Accessibility
- **Keyboard navigation** support for all interactive elements
- **Screen reader compatibility** with proper ARIA labels
- **High contrast** text for better readability
- **Focus indicators** for keyboard users

---

This documentation provides a comprehensive overview of all features implemented in the Powerpuff Girls Pong application, including detailed code examples and technical specifications for each major functionality.
