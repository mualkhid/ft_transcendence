﷽
# API Documentation

This document describes all available API endpoints for the application, with notes on how the frontend should use them.

---

## Authentication

### Register User
- **POST** `/api/auth/registerUser`
- **Description:** Creates a new user account.  
- **Frontend Use:** Call this when a new user signs up. On success, redirect them to the login page.
- **Body:**
```json
{
  "username": "string (3–10 chars, letters/numbers/underscore)",
  "email": "string (valid email)",
  "password": "string (8–64 chars, must include uppercase, number, and special character)"
}
```
- **Responses:**
  - `201 Created`: returns created user object  
  - `400 Bad Request`: invalid input  
  - `409 Conflict`: email already registered  
  - `500 Internal Server Error`

### Login
- **POST** `/api/auth/login`
- **Description:** Authenticates a user and returns a JWT token (also set in cookies).  
- **Frontend Use:** Store the returned token (cookies or localStorage). Use this token for all authenticated requests.
- **Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Responses:**
  - `200 OK`: `{ "message": "Login successful", "token": "jwt-token" }`  
  - `401 Unauthorized`: invalid credentials or 2FA failure  
  - `500 Internal Server Error`

### Logout
- **POST** `/api/auth/logout`
- **Description:** Logs out the user by clearing the authentication cookie.  
- **Frontend Use:** Call this when the user clicks “Logout” and clear any local auth state.
- **Responses:**
  - `200 OK`: `{ "message": "logged-out" }`

### Setup 2FA
- **POST** `/api/auth/setup-2fa`
- **Description:** Enables two-factor authentication (2FA) for the logged-in user and returns QR code + backup codes.  
- **Frontend Use:** Prompt user to scan QR code with authenticator app and securely display backup codes once.
- **Responses:**
  - `200 OK`: `{ "qr": "...", "secret": "base32secret", "backupCodes": ["code1", "code2"] }`

---

## Profile

### Get Current User
- **GET** `/api/profile/me`
- **Description:** Returns details of the currently authenticated user.  
- **Frontend Use:** Call this on app load to fetch user info for dashboards or headers.
- **Responses:**
  - `200 OK`: user object  
  - `404 Not Found`: if user doesn’t exist

### Update Username
- **PATCH** `/api/profile/username`
- **Description:** Updates the username of the logged-in user.  
- **Frontend Use:** Provide a form where users can change their username.
- **Body:**
```json
{ "newUsername": "string" }
```
- **Responses:**
  - `200 OK`: `{ "message": "username updated successfully" }`

### Update Password
- **PATCH** `/api/profile/password`
- **Description:** Updates the account password after verifying the current one.  
- **Frontend Use:** Place inside a password change form. Validate that new password differs from current one.
- **Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```
- **Responses:**
  - `200 OK`: `{ "message": "password updated successfully" }`  
  - `400 Bad Request`: current password equals new password  
  - `401 Unauthorized`: incorrect password  

### Update Avatar
- **PATCH** `/api/profile/avatar`
- **Description:** Uploads and updates the user’s avatar image (JPEG, PNG, WebP).  
- **Frontend Use:** Use in profile settings with a file upload form. Show returned avatar URL as preview.
- **Responses:**
  - `200 OK`: `{ "avatarUrl": "/avatars/2.png" }`  
  - `413 Payload Too Large`  
  - `415 Unsupported Media Type`

---

## Friends

### Get Friends
- **GET** `/api/friends`
- **Description:** Retrieves the user’s friend list.  
- **Frontend Use:** Display user’s friend list in a friends page or sidebar.

### Send Friend Request
- **POST** `/api/friends/sendRequest`
- **Description:** Sends a friend request to another user.  
- **Frontend Use:** Trigger when user clicks “Add Friend.”  
- **Body:**
```json
{ "userId": 123 }
```
- **Response:** `201 Created` → `{ "message": "request sent successfully" }`

### Accept Friend Request
- **POST** `/api/friends/acceptRequest`
- **Description:** Accepts a pending friend request.  
- **Frontend Use:** Show accept button in requests list.  
- **Body:**
```json
{ "userId": 123 }
```
- **Response:** `200 OK` → `{ "message": "request accepted successfully" }`

### Decline Friend Request
- **POST** `/api/friends/declineRequest`
- **Description:** Declines a pending friend request.  
- **Frontend Use:** Show decline button in requests list.  
- **Body:**
```json
{ "userId": 123 }
```
- **Response:** `204 No Content`

### Remove Friend
- **POST** `/api/friends/removeFriend`
- **Description:** Removes an existing friend.  
- **Frontend Use:** Add option in friend list UI to remove a friend.  
- **Body:**
```json
{ "userId": 123 }
```
- **Response:** `200 OK` → `{ "message": "friend removed successfully" }`

### Block Friend
- **POST** `/api/friends/blockFriend`
- **Description:** Blocks an existing friend (stops future interactions).  
- **Frontend Use:** Add block button in friend list UI.  
- **Body:**
```json
{ "userId": 123 }
```
- **Response:** `200 OK` → `{ "message": "friend blocked successfully" }`

### Search User
- **GET** `/api/friends/searchUser?q=term&page=1`
- **Description:** Searches users by email or username.  
- **Frontend Use:** Power search box for adding new friends.  
- **Response:** `200 OK` → `{ "users": [ ... ] }`

---

## Tournament

### Create Tournament
- **POST** `/api/tournament/create`
- **Description:** Creates a new tournament with 4 or 8 players.  
- **Frontend Use:** Call from a “Create Tournament” form.  
- **Body:**
```json
{
  "name": "Tournament Name",
  "aliases": ["Player1", "Player2", "Player3", "Player4"]
}
```
- **Response:** `201 Created` → tournament details

### Get Current Match
- **GET** `/api/tournament/current-match?tournamentId=1`
- **Description:** Retrieves the current match of the tournament.  
- **Frontend Use:** Poll or call this endpoint to display ongoing match details.  
- **Response:** current match details or tournament status

### Complete Match
- **POST** `/api/tournament/complete-match`
- **Description:** Marks a match as completed and assigns a winner.  
- **Frontend Use:** Call after game ends to update tournament state.  
- **Body:**
```json
{
  "matchId": 1,
  "winner": "Player1"
}
```
- **Response:** `200 OK` → match + tournament status

### Get Tournament Bracket
- **GET** `/api/tournament/bracket?tournamentId=1`
- **Description:** Returns the tournament bracket.  
- **Frontend Use:** Render bracket UI in the frontend.  
- **Response:** bracket data

### Reset Tournament
- **POST** `/api/tournament/reset`
- **Description:** Resets a tournament (or all if no ID provided).  
- **Frontend Use:** Admin action to reset tournaments.  
- **Body:**
```json
{ "tournamentId": 1 }
```
- **Response:** `200 OK` → reset confirmation

---

## Remote Game

### Connect to Remote Game
- **GET (WebSocket)** `/api/remote-game/:matchId`
- **Description:** Connects a player to a remote game session.  
- **Frontend Use:** The game client uses this to establish a WebSocket connection. Send input events, receive state updates.
- **Flow:**
  - On connect: server assigns `playerNumber`  
  - If two players connected: sends `{ "type": "ready" }`  
  - On message: handles player input (`keydown` / `keyup`, `up` / `down`)  
  - On disconnect: notifies the other player  

---
