# Backend-Frontend Connection Documentation
## Powerpuff Pong Application

This document provides a detailed overview of how the backend and frontend are connected for each page in the Powerpuff Pong application.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Page-by-Page Connection Details](#page-by-page-connection-details)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Error Handling](#error-handling)

## Architecture Overview

### Backend (Node.js + Fastify)
- **Framework**: Fastify with JWT authentication
- **Database**: SQLite with custom database wrapper
- **Port**: 3000
- **Base URL**: `http://localhost:3000/api`

### Frontend (TypeScript + Tailwind CSS)
- **Framework**: Vanilla TypeScript (no frameworks)
- **Styling**: Tailwind CSS
- **Build**: Custom build process with TypeScript compilation
- **Port**: Served via nginx (port 80)

### Communication Protocol

### Primary Communication Methods
- **HTTP REST API**: Main communication for CRUD operations
- **Data Format**: JSON for API requests/responses
- **Authentication**: JWT Bearer tokens
- **CORS**: Enabled for cross-origin requests

### Additional Communication Mechanisms

#### 1. Client-Side Storage
- **localStorage**: Persistent storage for authentication tokens and user data
- **sessionStorage**: Temporary session data
- **Data Persistence**: Survives browser restarts

#### 2. DOM Event Handling
- **Event Listeners**: Real-time user interaction handling
- **Form Submissions**: Automatic form validation and submission
- **Click Events**: Navigation and UI interactions
- **Keyboard Events**: Game controls and input handling

#### 3. File Upload Communication
- **Multipart Form Data**: Avatar and file uploads
- **File Validation**: Client-side and server-side validation
- **Progress Tracking**: Upload status feedback

#### 4. Real-time State Management
- **In-Memory Game State**: Active games stored in backend memory
- **State Synchronization**: Game state updates via polling
- **Session Management**: User session tracking

## Authentication Flow

### 1. Registration Process
```
Frontend → Backend
POST /api/register
Body: { username, email, password }
Response: { message, user }
```

**Frontend Code** (`main.ts:75-95`):
```typescript
const response = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
});
```

**Backend Handler** (`userController.js:5-35`):
```javascript
async function registerUser(request, reply) {
    // Validate input, check duplicates, hash password
    // Create user in database
    // Return success response
}
```

### 2. Login Process
```
Frontend → Backend
POST /api/login
Body: { email, password }
Response: { message, token, user }
```

**Frontend Code** (`main.ts:97-125`):
```typescript
const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

if (response.ok) {
    this.authToken = data.token;
    this.currentUser = data.user;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
}
```

**Backend Handler** (`userController.js:37-75`):
```javascript
async function loginUser(request, reply) {
    // Verify credentials, generate JWT token
    // Update last_seen timestamp
    // Return token and user data
}
```

## Page-by-Page Connection Details

### 1. Registration Page (`registrationPage`)

**Frontend Elements**:
- Username input (`regUsername`)
- Email input (`regEmail`)
- Password input (`regPassword`)
- Password requirements validation
- Submit button

**Backend Connection**:
- **Endpoint**: `POST /api/register`
- **Authentication**: None (public endpoint)
- **Validation**: Username/email uniqueness, password requirements
- **Response**: Success message or error details

**Data Flow**:
1. User fills registration form
2. Frontend validates password requirements in real-time
3. Form submission triggers `handleRegistration()` function
4. Frontend sends POST request to backend
5. Backend validates data and creates user
6. Frontend shows success message and redirects to login

### 2. Login Page (`loginPage`)

**Frontend Elements**:
- Email input (`loginEmail`)
- Password input (`loginPassword`)
- Submit button
- Link to registration page

**Backend Connection**:
- **Endpoint**: `POST /api/login`
- **Authentication**: None (public endpoint)
- **Validation**: Email/password combination
- **Response**: JWT token and user data

**Data Flow**:
1. User enters credentials
2. Frontend sends POST request to backend
3. Backend verifies credentials and generates JWT
4. Frontend stores token in localStorage
5. Frontend redirects to main app

### 3. Home Page (`homeSection`)

**Frontend Elements**:
- Welcome message with user stats
- Game options grid (1v1, 1vAI, Online, Tournament)
- Game instructions
- Navigation menu

**Backend Connections**:

#### User Profile Data
- **Endpoint**: `GET /api/profile`
- **Authentication**: JWT Bearer token
- **Response**: User profile with stats

**Frontend Code**:
```typescript
// Token is automatically included in requests
const response = await fetch('http://localhost:3000/api/profile', {
    headers: { 'Authorization': `Bearer ${this.authToken}` }
});
```

#### Game Creation
- **Endpoint**: `POST /api/games`
- **Authentication**: JWT Bearer token
- **Body**: `{ gameType, player1Id }`
- **Response**: Game ID and initial state

**Frontend Code** (`main.ts:280-300`):
```typescript
const response = await fetch('http://localhost:3000/api/games', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
    },
    body: JSON.stringify({
        gameType,
        player1Id: this.currentUser.id
    })
});
```

**Backend Handler** (`gameController.js:5-45`):
```javascript
async function createGame(request, reply) {
    // Validate game type
    // Create game record in database
    // Initialize game state
    // Return game ID and state
}
```

### 4. Friends Page (`friendsSection`)

**Frontend Elements**:
- Add friend form
- Friends list
- Friend requests list
- Search functionality

**Backend Connections**:

#### Send Friend Request
- **Endpoint**: `POST /api/friends/request`
- **Authentication**: JWT Bearer token
- **Body**: `{ friendId }`
- **Response**: Success message

#### Get Friends List
- **Endpoint**: `GET /api/friends`
- **Authentication**: JWT Bearer token
- **Response**: List of accepted friends with online status

#### Get Friend Requests
- **Endpoint**: `GET /api/friends/requests`
- **Authentication**: JWT Bearer token
- **Response**: Pending friend requests

#### Accept/Reject Friend Request
- **Endpoint**: `POST /api/friends/:friendId/accept` or `POST /api/friends/:friendId/reject`
- **Authentication**: JWT Bearer token
- **Response**: Success message

#### Search Users
- **Endpoint**: `GET /api/friends/search?query=username`
- **Authentication**: JWT Bearer token
- **Response**: Users matching search criteria

**Backend Handler** (`friendsController.js:5-35`):
```javascript
async function sendFriendRequest(request, reply) {
    // Validate request
    // Check for existing friendship
    // Create friend request
    // Return success message
}
```

### 5. Profile Page (`profileSection`)

**Frontend Elements**:
- Avatar display and upload
- Username and email display
- Game statistics
- Profile settings (username, email, 2FA, availability)

**Backend Connections**:

#### Get Profile
- **Endpoint**: `GET /api/profile`
- **Authentication**: JWT Bearer token
- **Response**: Complete user profile

#### Update Profile
- **Endpoint**: `PUT /api/profile`
- **Authentication**: JWT Bearer token
- **Body**: `{ username?, email?, two_factor_enabled?, availability? }`
- **Response**: Updated user data

#### Upload Avatar
- **Endpoint**: `POST /api/profile/avatar`
- **Authentication**: JWT Bearer token
- **Content-Type**: `multipart/form-data`
- **Response**: Avatar URL

**Frontend Code**:
```typescript
// Avatar upload
const formData = new FormData();
formData.append('avatar', file);
const response = await fetch('http://localhost:3000/api/profile/avatar', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${this.authToken}` },
    body: formData
});
```

**Backend Handler** (`userController.js:180-230`):
```javascript
async function uploadAvatar(request, reply) {
    // Validate file type and size
    // Save file to avatars directory
    // Update database with avatar URL
    // Return success response
}
```

### 6. Tournament Page (`tournamentsSection`)

**Frontend Elements**:
- Create tournament form
- Active tournaments list
- Join tournament form
- Tournament status

**Backend Connections**:

#### Create Tournament
- **Endpoint**: `POST /api/tournament/create`
- **Authentication**: None (public endpoint)
- **Response**: Tournament ID and details

#### Get Tournament
- **Endpoint**: `GET /api/tournament`
- **Authentication**: None (public endpoint)
- **Response**: Current tournament status

#### Join Tournament
- **Endpoint**: `POST /api/tournament/join`
- **Authentication**: None (public endpoint)
- **Body**: `{ userId }`
- **Response**: Success message

#### Next Match
- **Endpoint**: `GET /api/tournament/next-match`
- **Authentication**: None (public endpoint)
- **Response**: Match details with players

#### Reset Tournament
- **Endpoint**: `POST /api/tournament/reset`
- **Authentication**: None (public endpoint)
- **Response**: Success message

**Backend Handler** (`tournamentController.js:8-15`):
```javascript
async function createTournament(request, reply) {
    const tournament = createNewTournament("Tournament");
    return reply.status(201).send({
        ...tournament,
        message: 'Tournament created successfully!'
    });
}
```

### 7. Game Page (`gameSection`)

**Frontend Elements**:
- Canvas for game rendering
- Score display
- Game controls
- Game overlay for start/pause

**Backend Connections**:

#### Get Game State
- **Endpoint**: `GET /api/games/:gameId`
- **Authentication**: JWT Bearer token
- **Response**: Current game state

#### Update Game State
- **Endpoint**: `PUT /api/games/:gameId`
- **Authentication**: JWT Bearer token
- **Body**: `{ playerId, action, key }`
- **Response**: Updated game state

#### Get Game History
- **Endpoint**: `GET /api/games/history`
- **Authentication**: JWT Bearer token
- **Response**: User's game history

**Backend Handler** (`gameController.js:47-65`):
```javascript
async function getGameState(request, reply) {
    const { gameId } = request.params;
    const gameState = activeGames.get(parseInt(gameId));
    if (!gameState) {
        return reply.status(404).send({ error: 'Game not found' });
    }
    reply.status(200).send({ gameState });
}
```

## API Endpoints Reference

### Authentication Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | No | User registration |
| POST | `/api/login` | No | User login |

### User Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | Yes | Get user profile |
| PUT | `/api/profile` | Yes | Update user profile |
| POST | `/api/profile/avatar` | Yes | Upload avatar |
| POST | `/api/profile/stats` | Yes | Update game stats |
| GET | `/api/users` | Yes | Get all users |
| GET | `/api/users/search` | Yes | Search users |

### Game Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/games` | Yes | Create new game |
| GET | `/api/games/:gameId` | Yes | Get game state |
| PUT | `/api/games/:gameId` | Yes | Update game state |
| GET | `/api/games/history` | Yes | Get game history |

### Friends Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/friends/request` | Yes | Send friend request |
| POST | `/api/friends/:friendId/accept` | Yes | Accept friend request |
| POST | `/api/friends/:friendId/reject` | Yes | Reject friend request |
| GET | `/api/friends/requests` | Yes | Get friend requests |
| GET | `/api/friends` | Yes | Get friends list |
| DELETE | `/api/friends/:friendId` | Yes | Remove friend |
| GET | `/api/friends/search` | Yes | Search users for friends |

### Tournament Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/tournament/create` | No | Create tournament |
| GET | `/api/tournament` | No | Get tournament |
| POST | `/api/tournament/join` | No | Join tournament |
| GET | `/api/tournament/next-match` | No | Get next match |
| POST | `/api/tournament/reset` | No | Reset tournament |

## Communication Mechanisms in Detail

### 1. HTTP REST API Communication
The primary communication method for data exchange between frontend and backend.

#### Authentication Flow
```
User → Frontend Form → Backend API → Database
     ← JWT Token ← User Data ← Validation ←
```

#### Game Creation Flow
```
User → Game Selection → Frontend → Backend API → Database
     ← Game State ← Game ID ← Game Creation ←
```

#### Real-time Game Updates
```
Player Input → Frontend → Backend API → Game State Update
             ← Updated State ← Physics Calculation ←
```

### 2. Client-Side Storage Communication

#### Authentication Token Management
```typescript
// Frontend stores authentication data
localStorage.setItem('authToken', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// Frontend retrieves authentication data
const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user') || '{}');
```

#### Data Persistence Flow
```
Login Success → Store in localStorage → Survive Browser Restart
             ← Retrieve on App Load ← Check Authentication Status
```

### 3. DOM Event Communication

#### User Interaction Flow
```
User Click → Event Listener → Frontend Handler → API Call → Backend
         ← UI Update ← Response Processing ← Backend Response
```

#### Form Submission Flow
```
Form Input → Validation → Event Handler → API Request → Backend
         ← Success/Error ← Response Processing ← Backend Validation
```

#### Game Control Flow
```
Keyboard Input → Event Listener → Game State Update → API Call
              ← Visual Feedback ← State Processing ← Backend Update
```

### 4. File Upload Communication

#### Avatar Upload Flow
```
File Selection → FormData Creation → Multipart Upload → Backend
              ← Upload Progress ← File Processing ← File Storage
```

#### File Validation Flow
```
File Input → Client Validation → Server Validation → Database Update
         ← Success/Error ← File Processing ← File Type/Size Check
```

### 5. Real-time State Management

#### Game State Synchronization
```
Game Creation → In-Memory State → State Updates → API Polling
              ← State Changes ← Physics Engine ← Player Input
```

#### Session Management
```
User Activity → Last Seen Update → Session Tracking → Online Status
              ← Session Data ← Database Query ← Timeout Check
```

## Error Handling & Communication Failures

### Frontend Error Handling
- **Network errors**: Retry mechanism with exponential backoff
- **Authentication errors**: Redirect to login page, clear localStorage
- **Validation errors**: Display user-friendly messages
- **Server errors**: Show generic error message
- **Storage errors**: Fallback to sessionStorage or memory

### Backend Error Handling
- **Input validation**: Return 400 with specific error messages
- **Authentication failures**: Return 401/403 with clear messages
- **Database errors**: Log and return 500 with generic message
- **File upload errors**: Return appropriate HTTP status codes
- **Memory errors**: Handle in-memory state corruption

### Communication Failure Scenarios

#### Network Connectivity Issues
```
Frontend → Network Error → Retry Logic → Fallback UI
         ← Error Message ← Timeout ← Connection Lost
```

#### Storage Access Issues
```
localStorage Error → sessionStorage Fallback → Memory Storage
                  ← Data Recovery ← Browser Storage ← User Action
```

#### Event Handling Failures
```
Event Listener Error → Error Boundary → Graceful Degradation
                    ← Error Recovery ← User Interaction ← System Reset
```

### Common Error Scenarios
1. **Invalid credentials**: 401 Unauthorized
2. **Duplicate username/email**: 409 Conflict
3. **Missing authentication**: 401 Unauthorized
4. **Invalid game type**: 400 Bad Request
5. **Game not found**: 404 Not Found
6. **Friend request already exists**: 409 Conflict

## Security Considerations

### Authentication
- JWT tokens with expiration
- Password hashing with bcrypt
- CORS configuration for frontend domain
- Input validation and sanitization

### File Uploads
- File type validation (images only)
- File size limits (10MB)
- Secure file storage outside web root
- Unique filename generation

### API Security
- Rate limiting (implemented via Fastify plugins)
- Input validation using JSON schemas
- SQL injection prevention via parameterized queries
- XSS prevention via proper content types

## Performance Considerations

### Frontend Performance
- **Lazy loading**: Sections loaded on demand
- **Efficient DOM manipulation**: Minimal reflows and repaints
- **Minimal API calls**: Caching and request optimization
- **Local storage**: Reduce server round trips
- **Event delegation**: Efficient event handling
- **Memory management**: Cleanup of event listeners

### Backend Performance
- **Database connection pooling**: Efficient database connections
- **Efficient queries**: Proper indexing and query optimization
- **In-memory game state**: Fast access to active games
- **File serving optimization**: Efficient static file delivery
- **Caching strategies**: Reduce redundant computations
- **Memory management**: Cleanup of inactive game states

### Communication Optimization

#### Request Batching
```
Multiple Requests → Batch Processing → Single Response
                  ← Optimized Data ← Reduced Network Overhead
```

#### Caching Strategies
```
API Response → Cache Storage → Subsequent Requests
             ← Cached Data ← Cache Hit ← Reduced API Calls
```

#### State Synchronization
```
Game Updates → Delta Updates → Minimal Data Transfer
             ← State Diffs ← Efficient Sync ← Reduced Bandwidth
```

## Deployment Notes

### Backend Deployment
- Environment variables for configuration
- Database initialization on startup
- Health check endpoint
- Logging configuration

### Frontend Deployment
- Static file serving via nginx
- Build process with TypeScript compilation
- Asset optimization
- CORS configuration for backend communication

## Summary of Communication Methods

The Powerpuff Pong application uses a **multi-layered communication architecture** that goes far beyond simple HTTP requests:

### Primary Communication Layer
- **HTTP REST API**: Main data exchange for CRUD operations
- **JSON Data Format**: Structured data communication
- **JWT Authentication**: Secure token-based authentication

### Secondary Communication Layers
- **Client-Side Storage**: Persistent data management via localStorage
- **DOM Event System**: Real-time user interaction handling
- **File Upload System**: Multipart form data for file transfers
- **In-Memory State Management**: Real-time game state synchronization

### Communication Patterns
1. **Request-Response**: Traditional HTTP API calls
2. **Event-Driven**: DOM events and user interactions
3. **State Synchronization**: Game state updates and polling
4. **Data Persistence**: Client-side storage management
5. **File Transfer**: Multipart uploads and downloads

This documentation provides a comprehensive overview of the backend-frontend connection architecture for the Powerpuff Pong application, covering all pages, API endpoints, data flows, communication mechanisms, and security considerations.
