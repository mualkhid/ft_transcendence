﷽


# Backend API Documentation

**Base URL:**  
`http://localhost:3000/`

---

## Auth Routes (`authRoutes.js`)

### Login

- **Description:** Authenticates a user and returns a JWT token.
- **Frontend Use:** Store the token (e.g., in localStorage) and use it for authenticated requests.

- **POST** `/auth/login`

- **Body:**
  ```json
  {
    "alias": "string",
    "password": "string"
  }
  ```
- **Response:**
  - `200 OK`
    ```json
    { "token": "jwt-token" }
    ```
  - `401 Unauthorized`
    ```json
    { "error": "Invalid credentials" }
    ```

### Logout


- **Description:** Logs out the user (may invalidate token server-side).
- **Frontend Use:** Clear the token and redirect to login or home page.

- **POST** `/auth/logout`
- **Headers:**  
  `Authorization: Bearer <token>`

- **Response:**
  - `200 OK`
    ```json
    { "message": "Logged out successfully" }
    ```

---

## Friends Routes (`friendsRoute.js`)

### Get Friends List


- **Description:** Returns the current user's friends list.
- **Frontend Use:** Display the user's friends (e.g., in a sidebar or friends page).

- **GET** `/friends`
- **Headers:**  
  `Authorization: Bearer <token>`

- **Response:**
  - `200 OK`
    ```json
    [
      { "id": 2, "alias": "Bob" }
    ]
    ```

### Add Friend


- **Description:** Adds a user as a friend by alias.
- **Frontend Use:** Show a success message and update the friends list UI.

- **POST** `/friends/add`
- **Headers:**  
  `Authorization: Bearer <token>`

- **Body:**
  ```json
  {
    "friendAlias": "string"
  }
  ```
- **Response:**
  - `200 OK`
    ```json
    { "message": "Friend added" }
    ```
  - `404 Not Found`
    ```json
    { "error": "User not found" }
    ```

### Remove Friend


- **Description:** Removes a user from the friend list.
- **Frontend Use:** Show a success message and update the friends list UI.

- **POST** `/friends/remove`
- **Headers:**  
  `Authorization: Bearer <token>`

- **Body:**
  ```json
  {
    "friendAlias": "string"
  }
  ```
- **Response:**
  - `200 OK`
    ```json
    { "message": "Friend removed" }
    ```

---

## Profile Routes (`profileRoutes.js`)

### Get Profile


- **Description:** Returns the current user's profile info (alias, avatar, stats).
- **Frontend Use:** Display user profile (profile page, header, avatar, stats).

- **GET** `/profile`
- **Headers:**  
  `Authorization: Bearer <token>`

- **Response:**
  - `200 OK`
    ```json
    {
      "id": 1,
      "alias": "Alice",
      "avatar": "url",
      "stats": { "wins": 10, "losses": 5 }
    }
    ```

### Update Profile


- **Description:** Updates the user's profile (e.g., avatar).
- **Frontend Use:** Show a success message and update displayed profile info.

- **POST** `/profile/update`
- **Headers:**  
  `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "avatar": "url"
  }
  ```
- **Response:**
  - `200 OK`
    ```json
    { "message": "Profile updated" }
    ```

---

## Remote Game Routes (`remoteGameRoutes.js`)

### Create Remote Game


- **Description:** Creates a new remote game with a specified opponent.
- **Frontend Use:** Redirect to the game room or show game invitation status.

- **POST** `/remote-game/create`
- **Headers:**  
  `Authorization: Bearer <token>`

- **Body:**
  ```json
  {
    "opponentAlias": "string"
  }
  ```
- **Response:**
  - `201 Created`
    ```json
    { "gameId": 1, "status": "pending" }
    ```

### Get Remote Game State


- **Description:** Gets the current state of a remote game.
- **Frontend Use:** Render the game board and player info.

- **GET** `/remote-game/:gameId`
- **Headers:**  
  `Authorization: Bearer <token>`
  
- **Response:**
  - `200 OK`
    ```json
    {
      "gameId": 1,
      "players": ["Alice", "Bob"],
      "state": { ... }
    }
    ```

### Make Move

- **Description:** Submits a move for the current game.
- **Frontend Use:** Update the game board and state in real time.

- **POST** `/remote-game/:gameId/move`
- **Headers:**  
  `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "move": { ... }
  }
  ```
- **Response:**
  - `200 OK`
    ```json
    { "message": "Move accepted", "state": { ... } }
    ```

---

## Tournament Routes (`tournament.js`)

### Create Tournament

- **Description:** Creates a new tournament.
- **Frontend Use:** Show tournament lobby or registration page.

- **POST** `/tournament/create`
- **Headers:**  
  `Authorization: Bearer <token>`
- **Response:**
  - `201 Created`
    ```json
    { "id": 1, "status": "registration", "message": "Tournament created successfully!" }
    ```

### Join Tournament

- **Description:** Joins the current tournament.
- **Frontend Use:** Show confirmation and update tournament participant list.

- **POST** `/tournament/join`
- **Headers:**  
  `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "userId": 1
  }
  ```
- **Response:**
  - `200 OK`
    ```json
    { "message": "User joined tournament" }
    ```

### Get Tournament

- **Description:** Gets the current tournament details.
- **Frontend Use:** Display tournament info, participants, and status.

- **GET** `/tournament`
- **Headers:**  
  `Authorization: Bearer <token>`
- **Response:**
  - `200 OK`
    ```json
    { "id": 1, "status": "registration", "participantIds": [1,2] }
    ```

### Get Next Match

- **Description:** Gets info about the next scheduled match.
- **Frontend Use:** Show upcoming match details to participants.

- **GET** `/tournament/next-match`
- **Headers:**  
  `Authorization: Bearer <token>`
- **Response:**
  - `200 OK`
    ```json
    { "matchId": 1, "player1": {...}, "player2": {...} }
    ```

### Reset Tournament

- **Description:** Resets the tournament and clears matches.
- **Frontend Use:** Show confirmation and refresh tournament state.

- **POST** `/tournament/reset`
- **Headers:**  
  `Authorization: Bearer <token>`
- **Response:**
  - `200 OK`
    ```json
    { "message": "Tournament and matches reset successfully." }
    ```
