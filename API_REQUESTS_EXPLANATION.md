# API Requests Explanation
## Powerpuff Pong Application

This document explains each API request in detail, including its purpose, data flow, and handling mechanism.

## Table of Contents
1. [Authentication Requests](#authentication-requests)
2. [User Management Requests](#user-management-requests)
3. [Game Requests](#game-requests)
4. [Friends Requests](#friends-requests)
5. [Tournament Requests](#tournament-requests)

---

## Authentication Requests

### 1. POST `/api/register`
**Purpose**: Create a new user account

**What it does**:
- Validates user input (username, email, password)
- Checks for duplicate username/email
- Hashes the password securely
- Creates user record in database
- Returns user data (without password)

**Request Body**:
```json
{
  "username": "string (3-20 chars, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (8+ chars)"
}
```

**Response (201)**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 123,
    "username": "player1",
    "email": "player1@example.com",
    "avatar_url": null,
    "games_played": 0,
    "wins": 0,
    "losses": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**How it's handled**:
1. **Validation**: Fastify validates request body against schema
2. **Duplicate Check**: Database query for existing username/email
3. **Password Hashing**: bcrypt hashes password with salt rounds
4. **Database Insert**: Creates new user record
5. **Response**: Returns success message and user data

**Error Cases**:
- `409 Conflict`: Username/email already exists
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Database/server error

---

### 2. POST `/api/login`
**Purpose**: Authenticate user and get access token

**What it does**:
- Validates email/password combination
- Verifies password hash
- Generates JWT token
- Updates user's last_seen timestamp
- Returns token and user data

**Request Body**:
```json
{
  "email": "string (valid email format)",
  "password": "string"
}
```

**Response (200)**:
```json
{
  "message": "Login successful",
  "token": "jwt_token_string",
  "user": {
    "id": 123,
    "username": "player1",
    "email": "player1@example.com",
    "avatar_url": "/avatars/avatar_123_1234567890.jpg",
    "games_played": 5,
    "wins": 3,
    "losses": 2,
    "two_factor_enabled": false
  }
}
```

**How it's handled**:
1. **Email Lookup**: Find user by email address
2. **Password Verification**: bcrypt compares password with hash
3. **JWT Generation**: Creates signed token with user data
4. **Timestamp Update**: Updates last_seen field
5. **Response**: Returns token and user profile

**Error Cases**:
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Invalid input format
- `500 Internal Server Error`: Server error

---

## User Management Requests

### 3. GET `/api/profile`
**Purpose**: Get current user's profile information

**What it does**:
- Retrieves authenticated user's profile
- Includes game statistics and settings
- Shows online status and account details

**Authentication**: Required (JWT Bearer token)

**Response (200)**:
```json
{
  "user": {
    "id": 123,
    "username": "player1",
    "email": "player1@example.com",
    "avatar_url": "/avatars/avatar_123_1234567890.jpg",
    "games_played": 5,
    "wins": 3,
    "losses": 2,
    "two_factor_enabled": false,
    "created_at": "2024-01-01T00:00:00Z",
    "last_seen": "2024-01-01T12:00:00Z"
  }
}
```

**How it's handled**:
1. **Token Verification**: JWT middleware validates token
2. **User Lookup**: Database query by user ID from token
3. **Data Retrieval**: Gets complete user profile
4. **Response**: Returns user data

**Error Cases**:
- `401 Unauthorized`: Invalid/missing token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### 4. PUT `/api/profile`
**Purpose**: Update user profile information

**What it does**:
- Updates username, email, or settings
- Validates changes for uniqueness
- Returns updated profile data

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "username": "string (optional, 3-20 chars)",
  "email": "string (optional, valid email)",
  "two_factor_enabled": "boolean (optional)",
  "availability": "boolean (optional)"
}
```

**Response (200)**:
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 123,
    "username": "newUsername",
    "email": "newemail@example.com",
    "avatar_url": "/avatars/avatar_123_1234567890.jpg",
    "games_played": 5,
    "wins": 3,
    "losses": 2,
    "two_factor_enabled": true,
    "availability": true
  }
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Input Validation**: Schema validation for input data
3. **Uniqueness Check**: Verifies username/email not taken
4. **Database Update**: Updates user record
5. **Response**: Returns updated user data

**Error Cases**:
- `401 Unauthorized`: Invalid token
- `409 Conflict`: Username/email already exists
- `400 Bad Request`: Invalid input
- `500 Internal Server Error`: Server error

---

### 5. POST `/api/profile/avatar`
**Purpose**: Upload user avatar image

**What it does**:
- Accepts image file upload
- Validates file type and size
- Saves file to server
- Updates user's avatar_url

**Authentication**: Required (JWT Bearer token)

**Request**: Multipart form data
```
Content-Type: multipart/form-data
Body: avatar file (image/jpeg, image/png, image/gif, max 10MB)
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "avatar_url": "/avatars/avatar_123_1234567890.jpg"
}
```

**How it's handled**:
1. **File Validation**: Checks file type and size
2. **File Processing**: Reads file buffer
3. **File Storage**: Saves to avatars directory
4. **Database Update**: Updates user's avatar_url
5. **Response**: Returns success and file URL

**Error Cases**:
- `400 Bad Request`: Invalid file type
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Upload failed

---

### 6. POST `/api/profile/stats`
**Purpose**: Update user's game statistics

**What it does**:
- Increments game statistics (games played, wins, losses)
- Updates user's overall stats
- Used after game completion

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "games_played": 1,
  "wins": 1,
  "losses": 0
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Game statistics updated successfully",
  "stats": {
    "games_played": 6,
    "wins": 4,
    "losses": 2
  }
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Input Validation**: Checks data types
3. **Current Stats**: Gets existing statistics
4. **Update Calculation**: Adds new stats to existing
5. **Database Update**: Updates user record
6. **Response**: Returns updated statistics

**Error Cases**:
- `400 Bad Request`: Invalid data types
- `404 Not Found`: User not found
- `500 Internal Server Error`: Update failed

---

### 7. GET `/api/users`
**Purpose**: Get list of all users (for friend search)

**What it does**:
- Retrieves all registered users
- Excludes sensitive information
- Used for friend management

**Authentication**: Required (JWT Bearer token)

**Response (200)**:
```json
{
  "users": [
    {
      "id": 123,
      "username": "player1",
      "email": "player1@example.com",
      "avatar_url": "/avatars/avatar_123_1234567890.jpg",
      "games_played": 5,
      "wins": 3,
      "losses": 2,
      "created_at": "2024-01-01T00:00:00Z",
      "last_seen": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Database Query**: Selects all users
3. **Data Filtering**: Excludes password hashes
4. **Response**: Returns user list

**Error Cases**:
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Database error

---

### 8. GET `/api/users/search`
**Purpose**: Search users by username or email

**What it does**:
- Searches users by partial match
- Used for finding friends
- Requires minimum search length

**Authentication**: Required (JWT Bearer token)

**Query Parameters**:
```
?query=search_term (minimum 2 characters)
```

**Response (200)**:
```json
{
  "users": [
    {
      "id": 123,
      "username": "player1",
      "email": "player1@example.com",
      "avatar_url": "/avatars/avatar_123_1234567890.jpg",
      "games_played": 5,
      "wins": 3,
      "losses": 2,
      "created_at": "2024-01-01T00:00:00Z",
      "last_seen": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Query Validation**: Checks minimum length
3. **Database Search**: LIKE query on username/email
4. **Response**: Returns matching users

**Error Cases**:
- `400 Bad Request`: Query too short
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Database error

---

## Game Requests

### 9. POST `/api/games`
**Purpose**: Create a new game

**What it does**:
- Creates game record in database
- Initializes game state in memory
- Sets up game physics and scoring
- Returns game ID and initial state

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "gameType": "1v1|1vAI|online|tournament",
  "player1Id": 123,
  "player2Id": 456
}
```

**Response (201)**:
```json
{
  "message": "Game created successfully",
  "gameId": 789,
  "gameState": {
    "id": 789,
    "gameType": "1v1",
    "player1Id": 123,
    "player2Id": 456,
    "status": "active",
    "ball": {
      "x": 400,
      "y": 300,
      "velocityX": 5,
      "velocityY": 3,
      "radius": 10
    },
    "paddles": {
      "player1": { "x": 50, "y": 250, "width": 15, "height": 100, "velocity": 0 },
      "player2": { "x": 750, "y": 250, "width": 15, "height": 100, "velocity": 0 }
    },
    "scores": {
      "player1": 0,
      "player2": 0
    },
    "powerUps": [],
    "lastUpdate": 1640995200000
  }
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Input Validation**: Checks game type and players
3. **Database Insert**: Creates game record
4. **State Initialization**: Sets up game physics
5. **Memory Storage**: Stores in activeGames Map
6. **Response**: Returns game ID and state

**Error Cases**:
- `400 Bad Request`: Invalid game type
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Creation failed

---

### 10. GET `/api/games/:gameId`
**Purpose**: Get current game state

**What it does**:
- Retrieves game state from memory
- Returns current ball, paddle, and score positions
- Used for game synchronization

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:
```
:gameId (number) - Game identifier
```

**Response (200)**:
```json
{
  "gameState": {
    "id": 789,
    "gameType": "1v1",
    "player1Id": 123,
    "player2Id": 456,
    "status": "active",
    "ball": { "x": 400, "y": 300, "velocityX": 5, "velocityY": 3, "radius": 10 },
    "paddles": {
      "player1": { "x": 50, "y": 250, "width": 15, "height": 100, "velocity": 0 },
      "player2": { "x": 750, "y": 250, "width": 15, "height": 100, "velocity": 0 }
    },
    "scores": { "player1": 0, "player2": 0 },
    "powerUps": [],
    "lastUpdate": 1640995200000
  }
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Game Lookup**: Finds game in activeGames Map
3. **State Retrieval**: Gets current game state
4. **Response**: Returns game state

**Error Cases**:
- `404 Not Found`: Game doesn't exist
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Server error

---

### 11. PUT `/api/games/:gameId`
**Purpose**: Update game state (player input)

**What it does**:
- Processes player input (paddle movement)
- Updates game physics
- Handles collisions and scoring
- Returns updated game state

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:
```
:gameId (number) - Game identifier
```

**Request Body**:
```json
{
  "playerId": 123,
  "action": "paddle_move",
  "key": "up|down|stop"
}
```

**Response (200)**:
```json
{
  "message": "Game state updated",
  "gameState": {
    "id": 789,
    "gameType": "1v1",
    "player1Id": 123,
    "player2Id": 456,
    "status": "active",
    "ball": { "x": 405, "y": 303, "velocityX": 5, "velocityY": 3, "radius": 10 },
    "paddles": {
      "player1": { "x": 50, "y": 242, "width": 15, "height": 100, "velocity": -8 },
      "player2": { "x": 750, "y": 250, "width": 15, "height": 100, "velocity": 0 }
    },
    "scores": { "player1": 0, "player2": 0 },
    "powerUps": [],
    "lastUpdate": 1640995201000
  }
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Game Lookup**: Finds game in memory
3. **Input Processing**: Updates paddle velocity
4. **Physics Update**: Calculates new positions
5. **Collision Detection**: Handles ball-paddle collisions
6. **Scoring Check**: Updates scores if ball out of bounds
7. **Response**: Returns updated state

**Error Cases**:
- `404 Not Found`: Game doesn't exist
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Update failed

---

### 12. GET `/api/games/history`
**Purpose**: Get user's game history

**What it does**:
- Retrieves all games user participated in
- Shows game results and opponents
- Includes game statistics

**Authentication**: Required (JWT Bearer token)

**Response (200)**:
```json
{
  "games": [
    {
      "id": 789,
      "game_type": "1v1",
      "player1_id": 123,
      "player2_id": 456,
      "winner_id": 123,
      "status": "completed",
      "created_at": "2024-01-01T12:00:00Z",
      "ended_at": "2024-01-01T12:05:00Z",
      "player1_name": "player1",
      "player2_name": "player2",
      "winner_name": "player1"
    }
  ]
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **User ID Extraction**: Gets user ID from token
3. **Database Query**: Joins games with user data
4. **Data Processing**: Formats game history
5. **Response**: Returns game list

**Error Cases**:
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Database error

---

## Friends Requests

### 13. POST `/api/friends/request`
**Purpose**: Send friend request

**What it does**:
- Creates friend request in database
- Validates user exists
- Prevents duplicate requests

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "friendId": 456
}
```

**Response (201)**:
```json
{
  "message": "Friend request sent to player2",
  "friend": {
    "id": 456,
    "username": "player2"
  }
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Input Validation**: Checks friend ID
3. **Duplicate Check**: Prevents existing requests
4. **User Validation**: Ensures friend exists
5. **Database Insert**: Creates friendship record
6. **Response**: Returns success message

**Error Cases**:
- `400 Bad Request`: Cannot request yourself
- `404 Not Found`: User not found
- `409 Conflict`: Request already exists
- `500 Internal Server Error`: Database error

---

### 14. POST `/api/friends/:friendId/accept`
**Purpose**: Accept friend request

**What it does**:
- Updates friendship status to accepted
- Creates mutual friendship

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:
```
:friendId (number) - Friend's user ID
```

**Response (200)**:
```json
{
  "message": "Friend request accepted"
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Request Lookup**: Finds pending request
3. **Status Update**: Changes to accepted
4. **Response**: Returns success message

**Error Cases**:
- `404 Not Found`: Request not found
- `500 Internal Server Error`: Update failed

---

### 15. POST `/api/friends/:friendId/reject`
**Purpose**: Reject friend request

**What it does**:
- Deletes friend request
- Removes pending friendship

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:
```
:friendId (number) - Friend's user ID
```

**Response (200)**:
```json
{
  "message": "Friend request rejected"
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Request Lookup**: Finds pending request
3. **Record Deletion**: Removes friendship
4. **Response**: Returns success message

**Error Cases**:
- `404 Not Found`: Request not found
- `500 Internal Server Error`: Deletion failed

---

### 16. GET `/api/friends/requests`
**Purpose**: Get pending friend requests

**What it does**:
- Retrieves incoming friend requests
- Shows request details and user info

**Authentication**: Required (JWT Bearer token)

**Response (200)**:
```json
{
  "requests": [
    {
      "id": 1,
      "user_id": 456,
      "friend_id": 123,
      "status": "pending",
      "created_at": "2024-01-01T12:00:00Z",
      "username": "player2",
      "avatar_url": "/avatars/avatar_456_1234567890.jpg",
      "last_seen": "2024-01-01T12:00:00Z",
      "user_created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **User ID Extraction**: Gets user ID from token
3. **Database Query**: Joins with user data
4. **Response**: Returns request list

**Error Cases**:
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Database error

---

### 17. GET `/api/friends`
**Purpose**: Get friends list

**What it does**:
- Retrieves accepted friends
- Shows online status
- Includes friend details

**Authentication**: Required (JWT Bearer token)

**Response (200)**:
```json
{
  "friends": [
    {
      "id": 456,
      "username": "player2",
      "avatar_url": "/avatars/avatar_456_1234567890.jpg",
      "last_seen": "2024-01-01T12:00:00Z",
      "user_created_at": "2024-01-01T00:00:00Z",
      "status": "online"
    }
  ]
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **User ID Extraction**: Gets user ID from token
3. **Database Query**: Finds accepted friendships
4. **Status Calculation**: Determines online status
5. **Response**: Returns friends list

**Error Cases**:
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Database error

---

### 18. DELETE `/api/friends/:friendId`
**Purpose**: Remove friend

**What it does**:
- Deletes friendship record
- Removes mutual friendship

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:
```
:friendId (number) - Friend's user ID
```

**Response (200)**:
```json
{
  "message": "Friend removed"
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Friendship Lookup**: Finds friendship record
3. **Record Deletion**: Removes friendship
4. **Response**: Returns success message

**Error Cases**:
- `404 Not Found`: Friendship not found
- `500 Internal Server Error`: Deletion failed

---

### 19. GET `/api/friends/search`
**Purpose**: Search users for friend requests

**What it does**:
- Searches users not already friends
- Excludes current user and existing friends
- Used for finding new friends

**Authentication**: Required (JWT Bearer token)

**Query Parameters**:
```
?query=search_term (minimum 2 characters)
```

**Response (200)**:
```json
{
  "users": [
    {
      "id": 789,
      "username": "player3",
      "email": "player3@example.com",
      "avatar_url": "/avatars/avatar_789_1234567890.jpg",
      "games_played": 10,
      "wins": 7,
      "losses": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "last_seen": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**How it's handled**:
1. **Token Verification**: Validates authentication
2. **Query Validation**: Checks minimum length
3. **User Exclusion**: Excludes current user and friends
4. **Database Search**: LIKE query on username/email
5. **Response**: Returns matching users

**Error Cases**:
- `400 Bad Request`: Query too short
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Database error

---

## Tournament Requests

### 20. POST `/api/tournament/create`
**Purpose**: Create new tournament

**What it does**:
- Creates tournament in memory
- Initializes tournament state
- Sets up participant tracking

**Authentication**: None (public endpoint)

**Response (201)**:
```json
{
  "id": 1,
  "name": "Tournament",
  "status": "registration",
  "participantIds": [],
  "message": "Tournament created successfully!"
}
```

**How it's handled**:
1. **Tournament Creation**: Calls tournament service
2. **State Initialization**: Sets up tournament structure
3. **Response**: Returns tournament data

**Error Cases**:
- `500 Internal Server Error`: Creation failed

---

### 21. GET `/api/tournament`
**Purpose**: Get current tournament

**What it does**:
- Retrieves active tournament
- Shows tournament status and participants

**Authentication**: None (public endpoint)

**Response (200)**:
```json
{
  "id": 1,
  "name": "Tournament",
  "status": "registration",
  "participantIds": [123, 456, 789]
}
```

**Response (404)**:
```json
{
  "error": "No tournament found"
}
```

**How it's handled**:
1. **Tournament Lookup**: Gets current tournament
2. **Status Check**: Returns tournament state
3. **Response**: Returns tournament data or 404

**Error Cases**:
- `404 Not Found`: No tournament exists

---

### 22. POST `/api/tournament/join`
**Purpose**: Join tournament

**What it does**:
- Adds user to tournament participants
- Validates user exists
- Checks tournament status

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "userId": 123
}
```

**Response (200)**:
```json
{
  "message": "player1 joined the tournament."
}
```

**How it's handled**:
1. **Input Validation**: Checks user ID
2. **User Validation**: Ensures user exists
3. **Tournament Check**: Verifies tournament exists
4. **Status Validation**: Checks registration is open
5. **Duplicate Check**: Prevents double joining
6. **Participant Addition**: Adds user to list
7. **Response**: Returns success message

**Error Cases**:
- `400 Bad Request`: Invalid user ID
- `404 Not Found`: User or tournament not found
- `403 Forbidden`: Tournament not accepting players
- `409 Conflict`: User already joined
- `500 Internal Server Error`: Join failed

---

### 23. GET `/api/tournament/next-match`
**Purpose**: Get next tournament match

**What it does**:
- Finds available players for next match
- Creates match pairing
- Returns match details

**Authentication**: None (public endpoint)

**Response (200)**:
```json
{
  "matchId": 1,
  "player1": {
    "id": 123,
    "alias": "player1"
  },
  "player2": {
    "id": 456,
    "alias": "player2"
  }
}
```

**Response (400)**:
```json
{
  "error": "Not enough players"
}
```

**How it's handled**:
1. **Tournament Lookup**: Gets current tournament
2. **Participant Check**: Verifies participants exist
3. **Match Tracking**: Checks already matched players
4. **Player Selection**: Finds available players
5. **Match Creation**: Creates new match
6. **Response**: Returns match details

**Error Cases**:
- `404 Not Found`: No tournament or participants
- `400 Bad Request`: Not enough players
- `500 Internal Server Error`: Match creation failed

---

### 24. POST `/api/tournament/reset`
**Purpose**: Reset tournament

**What it does**:
- Clears tournament state
- Removes all participants
- Resets matches

**Authentication**: None (public endpoint)

**Response (200)**:
```json
{
  "message": "Tournament and matches reset successfully."
}
```

**How it's handled**:
1. **Tournament Reset**: Clears tournament data
2. **Match Clear**: Removes all matches
3. **Response**: Returns success message

**Error Cases**:
- `500 Internal Server Error`: Reset failed

---

## Summary

The Powerpuff Pong API consists of **24 different endpoints** across **5 categories**:

### Authentication (2 endpoints)
- User registration and login

### User Management (6 endpoints)
- Profile management, avatar uploads, user search

### Game Management (4 endpoints)
- Game creation, state updates, game history

### Friends Management (7 endpoints)
- Friend requests, friend lists, user search

### Tournament Management (5 endpoints)
- Tournament creation, joining, match management

Each request follows a consistent pattern:
1. **Authentication check** (if required)
2. **Input validation** (schema validation)
3. **Business logic** (database operations)
4. **Response formatting** (structured JSON)
5. **Error handling** (appropriate HTTP status codes)

The API uses **JWT tokens** for authentication, **JSON schemas** for validation, and **SQLite** for data persistence, with **in-memory storage** for real-time game state.

