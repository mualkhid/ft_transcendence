import { 
    createMatch, 
    startMatch, 
    completeMatch,
} from './matchDatabaseService.js';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const activeMatches = new Map();
const waitingPlayers = new Map(); 

// Add a counter for sequential match IDs to avoid collisions
let matchIdCounter = 1;
const generateMatchId = () => matchIdCounter++;

export async function createMatchState(matchId, player1Username = 'Player1', player2Username = 'Player2')
{
    const numericMatchId = parseInt(matchId);
    
    if (activeMatches.has(numericMatchId))
        return activeMatches.get(numericMatchId);

    if(!activeMatches.has(numericMatchId))
    {
        let dbMatch = await createMatch(player1Username, player2Username, numericMatchId);

        const matchState = {
            player1: null,
            player2: null,
            matchId: dbMatch.id,
            state: {
                status: 'waiting',
                connectedPlayers: 0,
                matchStarted: false,
                gameFinished: false,
                player1Keys: {
                    up: false,
                    down: false
                },
                player2Keys: {
                    up: false,
                    down: false
                },
                ballPositionX: 400,
                ballPositionY: 300,
                speedX : 5,
                speedY: 3,
                radius: 10,
                canvasHeight:600,
                leftPaddleX: 50,
                leftPaddleY: 250,
                rightPaddleX: 735,
                rightPaddleY: 250,         
                paddleWidth: 15,
                paddleHeight: 100,
                canvasWidth: 800,
                scorePlayer1: 0,
                scorePlayer2: 0,
                maxScore: 5,
                gameLoopInterval: null,
                matchStarted: false,
                player1Username,
                player2Username,
                readyState: false,
            }
        };
        
        activeMatches.set(numericMatchId, matchState);
        return matchState;
    }
    return activeMatches.get(numericMatchId);
}

export async function addPlayerToMatch(matchId, websocket, username = null)
{
    const match = await createMatchState(matchId);
    
    if(!match) 
        return null;
    
    if (match.state.gameFinished) {
        console.log(`Cannot join match ${matchId}: game already finished`);
        return null;
    }

    const wasPlayer1 = match.state.player1Username === username;
    const wasPlayer2 = match.state.player2Username === username;

    if (wasPlayer1) {
        console.log(`Reconnecting ${username} as player 1`);
        match.player1 = websocket;
        if (match.state.connectedPlayers === 0) {
            match.state.connectedPlayers = 1;
        }
        return 1;
    }
    
    if (wasPlayer2) {
        console.log(`Reconnecting ${username} as player 2`);
        match.player2 = websocket;
        if (match.state.connectedPlayers === 1) {
            match.state.connectedPlayers = 2;
        } else {
            match.state.connectedPlayers = 1;
        }
        return 2;
    }

    if(!match.player1)
    {
        match.player1 = websocket;
        match.state.connectedPlayers++;
        if (username)
            match.state.player1Username = username;
        return (1);
    }
    
    if(!match.player2)
    {
        match.player2 = websocket;
        match.state.connectedPlayers++;
        if (username)
            match.state.player2Username = username;
        return (2);
    }
    return (null);
}

export function removePlayerFromMatch(matchId, websocket) {
    const match = activeMatches.get(matchId);
    if (!match) return null;

    let disconnectedPlayer = null;
    if (match.player1 === websocket) {
        match.player1 = null;
        match.state.connectedPlayers--;
        disconnectedPlayer = 1;
    } else if (match.player2 === websocket) {
        match.player2 = null;
        match.state.connectedPlayers--;
        disconnectedPlayer = 2;
    }

    // Only handle active game disconnects
    if (disconnectedPlayer && !match.state.gameFinished) {
        console.log(`🛑 Player ${disconnectedPlayer} disconnected. Handling cleanup.`);

        // CRITICAL: Stop the game loop immediately and mark as finished
        if (match.state.gameLoopInterval) {
            clearInterval(match.state.gameLoopInterval);
            match.state.gameLoopInterval = null;
        }
        match.state.gameFinished = true;

        // Notify the remaining player
        const remainingPlayer = disconnectedPlayer === 1 ? match.player2 : match.player1;
        const remainingPlayerUsername = disconnectedPlayer === 1 ? match.state.player2Username : match.state.player1Username;

        if (remainingPlayer && remainingPlayer.readyState === 1) {
            const abandonMessage = {
                type: 'game-abandoned',
                message: `Opponent disconnected. You win!`,
                winner: disconnectedPlayer === 1 ? 2 : 1,
                winnerAlias: remainingPlayerUsername
            };
            remainingPlayer.send(JSON.stringify(abandonMessage));
            console.log('Sent win-by-disconnect message to remaining player.');
        }

        // Update database and clean up
        // This logic is mostly correct in your original code.
        // You can keep the setTimeout to delete the match from the map
        // after a short delay.
        activeMatches.delete(matchId);
        console.log(`Match ${matchId} deleted from memory after cleanup.`);
    }
     if (!match.player1 && !match.player2) {
        activeMatches.delete(matchId);
        console.log(`Match ${matchId} deleted from memory (both players gone).`);
    }

    return disconnectedPlayer;
}

export function getMatch(matchId)
{
    if(activeMatches.get(matchId))
        return(activeMatches.get(matchId));
    return (null);
}

export function handlePlayerInput(matchId, playerNumber, inputType, inputState)
{
    const match = getMatch(matchId);
    if(!match)
        return (null);

    // SAFETY CHECK: Don't process input if game is finished
    if (match.state.gameFinished) {
        console.log(`Ignoring input for finished game ${matchId}`);
        return null;
    }

    const playerKey = playerNumber === 1 ? 'player1Keys' : 'player2Keys';
    
    if(inputType === "keydown")
    {
        if(inputState === 'up')
            match.state[playerKey].up = true;
        if(inputState === 'down')
            match.state[playerKey].down = true;
    }
     
    if(inputType === "keyup")
    {
        if(inputState === 'up')
            match.state[playerKey].up = false;
        if(inputState === 'down')
            match.state[playerKey].down = false;
    }
    return {
        playerNumber,
        inputType,
        inputState,
        currentKeys: {
            player1Keys: match.state.player1Keys,
            player2Keys: match.state.player2Keys
        }
    };
}

export function getInputStates(matchId)
{
    const match = getMatch(matchId);
    if(!match)
            return (null);
    return {
        player1Keys: match.state.player1Keys,
        player2Keys: match.state.player2Keys
    }
}

function updatePaddlePosition(match)
{
    const paddleSpeed = 8;

    //Player 1 Paddle Movement
    if(match.state.player1Keys.up)
        match.state.leftPaddleY = Math.max(0, match.state.leftPaddleY - paddleSpeed);
    if(match.state.player1Keys.down)
        match.state.leftPaddleY = Math.min(match.state.canvasHeight - match.state.paddleHeight, match.state.leftPaddleY + paddleSpeed);

    //Player2 Paddle Movement
    if(match.state.player2Keys.up)
        match.state.rightPaddleY = Math.max(0, match.state.rightPaddleY - paddleSpeed);
    if(match.state.player2Keys.down)
        match.state.rightPaddleY = Math.min(match.state.canvasHeight - match.state.paddleHeight, match.state.rightPaddleY + paddleSpeed);
}

function checkCollisions(match) {
    // Left paddle
    if (match.state.ballPositionX - match.state.radius <= match.state.leftPaddleX + match.state.paddleWidth &&
       match.state.ballPositionY >= match.state.leftPaddleY &&
       match.state.ballPositionY <= match.state.leftPaddleY + match.state.paddleHeight) {
        match.state.speedX = Math.abs(match.state.speedX);
        addSpin(match);
    }

    // Right paddle
    if (match.state.ballPositionX + match.state.radius >= match.state.rightPaddleX &&
       match.state.ballPositionY >=match.state.rightPaddleY &&
       match.state.ballPositionY <=match.state.rightPaddleY + match.state.paddleHeight) {
        match.state.speedX = -Math.abs(match.state.speedX);
        addSpin(match);
    }
}

function addSpin(match)
{
    const spin = (Math.random() - 0.5) * 2;
    match.state.speedY = Math.max(-8, Math.min(8, match.state.speedY + spin));
}

function resetBall(match)
{
    match.state.ballPositionX = match.state.canvasWidth / 2;
    match.state.ballPositionY = match.state.canvasHeight / 2;
    match.state.speedX = Math.random() > 0.5 ? 5 : -5;
    match.state.speedY = (Math.random() - 0.5) * 6;
}

export async function updateBall(matchId)
{
    const match = getMatch(matchId);
    if(!match)
        return (null);

    // CRITICAL SAFETY CHECK: Don't update if game is finished or if no game loop interval
    if (match.state.gameFinished) {
        console.log(`🛑 Game ${matchId} is finished, stopping ball updates`);
        if (match.state.gameLoopInterval) {
            clearInterval(match.state.gameLoopInterval);
            match.state.gameLoopInterval = null;
        }
        return null;
    }

    // Check if both players are still connected
    if (match.state.connectedPlayers < 2) {
        console.log(`🛑 Not enough players in match ${matchId} (${match.state.connectedPlayers}/2), stopping game`);
        if (match.state.gameLoopInterval) {
            clearInterval(match.state.gameLoopInterval);
            match.state.gameLoopInterval = null;
        }
        match.state.gameFinished = true;
        return null;
    }

    if (!match.state.matchStarted && match.state.connectedPlayers === 2)
    {
        match.state.matchStarted = true;
        if (match.matchId)
        {
            await startMatch(match.matchId).catch(error => {
                console.error(`Failed to start match in DB: ${error.message}`);
            });
        }
    }
    
    updatePaddlePosition(match);
    match.state.ballPositionX += match.state.speedX;
    match.state.ballPositionY += match.state.speedY;

    // Bounce top/bottom
    if (match.state.ballPositionY - match.state.radius <= 0 || match.state.ballPositionY + match.state.radius >= match.state.canvasHeight)
        match.state.speedY *= -1;
    
    if (match.state.ballPositionX - match.state.radius <= 0)
    {
        match.state.scorePlayer2++;
        if(match.state.scorePlayer2 >= match.state.maxScore)
        {
            console.log(`🏆 Player 2 wins match ${matchId}! Stopping game immediately.`);
            if (match.state.gameLoopInterval)
            {
                clearInterval(match.state.gameLoopInterval);
                match.state.gameLoopInterval = null;
            }
            match.state.gameFinished = true;
            await updateDashboardStats(
                match.state.player1Username, 
                match.state.player2Username,
                match.state.player2Username
            );
            await broadcastGameOver(match, 2, matchId);
            return;
        }
        resetBall(match);
        broadcastGameState(match);
    }
    
    if (match.state.ballPositionX + match.state.radius >= match.state.canvasWidth) {
        match.state.scorePlayer1++; 
        if(match.state.scorePlayer1 >= match.state.maxScore)
        {
            console.log(`🏆 Player 1 wins match ${matchId}! Stopping game immediately.`);
            if (match.state.gameLoopInterval)
            {
                clearInterval(match.state.gameLoopInterval);
                match.state.gameLoopInterval = null;
            }
            match.state.gameFinished = true;
            await updateDashboardStats(
                match.state.player1Username, 
                match.state.player2Username, 
                match.state.player1Username
            );
            await broadcastGameOver(match, 1, matchId);
            return;
        }
        resetBall(match);
        broadcastGameState(match);
    }
    checkCollisions(match);
    broadcastGameState(match);
}

function broadcastGameState(match)
{
    // SAFETY CHECK: Don't broadcast if game is finished
    if (match.state.gameFinished) {
        console.log(`Game finished, not broadcasting game state`);
        return;
    }

    const gameUpdate = JSON.stringify({
        type: 'game-state',
        ballX: match.state.ballPositionX,
        ballY: match.state.ballPositionY,
        leftPaddleY: match.state.leftPaddleY,
        rightPaddleY: match.state.rightPaddleY,
        speedX: match.state.speedX,
        speedY: match.state.speedY,
        player1Score: match.state.scorePlayer1,
        player2Score: match.state.scorePlayer2,
        player1Username: match.state.player1Username,
        player2Username: match.state.player2Username
    });
    if(match.player1 && match.player1.readyState === 1)
        match.player1.send(gameUpdate);
    if(match.player2 && match.player2.readyState === 1)
        match.player2.send(gameUpdate);
}

async function broadcastGameOver(match, winner, matchId)
{
    const winnerUsername = winner === 1 ? match.state.player1Username : match.state.player2Username;
    const gameOverData = JSON.stringify({
        type: 'game-over',
        winner: winner,
        winnerAlias: winnerUsername,
        player1Score: match.state.scorePlayer1,
        player2Score: match.state.scorePlayer2,
        player1Username: match.state.player1Username,
        player2Username: match.state.player2Username
    });

    console.log(`Broadcasting game over for match ${matchId}: ${winnerUsername} wins`);

    // Send to player 1
    if(match.player1 && match.player1.readyState === 1)
        match.player1.send(gameOverData);
    // Send to player 2
    if(match.player2 && match.player2.readyState === 1)
        match.player2.send(gameOverData);
        
    // Update database
    if (match.matchId)
    {
        await completeMatch(
            match.matchId, 
            winnerUsername, 
            match.state.scorePlayer1, 
            match.state.scorePlayer2
        );
    }
    
    // Clean up game loop - ENSURE it's stopped
    if (match.state.gameLoopInterval)
    {
        clearInterval(match.state.gameLoopInterval);
        match.state.gameLoopInterval = null;
        console.log(`🛑 Game loop stopped for match ${matchId} after game over`);
    }
    
    // Mark as finished
    match.state.gameFinished = true;
    
    console.log(`Game over broadcast complete for match ${matchId}`);
}

// Fixed findOrCreateMatch to prevent reconnection to finished games
export async function findorCreateMatch(websocket, username)
{
    console.log('FindOrCreateMatch called for:', username);
    console.log('Current waiting players:', Array.from(waitingPlayers.keys()));
    console.log('Current active matches:', Array.from(activeMatches.keys()));
    
    // First, check if user is already in an existing match (reconnection scenario)
    for (const [matchId, match] of activeMatches) {
        const isPlayer1 = match.state.player1Username === username;
        const isPlayer2 = match.state.player2Username === username;
        
        if (isPlayer1 || isPlayer2) {
            console.log(`User ${username} found in existing match ${matchId}`);
            console.log(`Game finished: ${match.state.gameFinished}`);
            
            // Don't allow reconnection to finished games
            if (match.state.gameFinished) {
                console.log(`Match ${matchId} is finished, not allowing reconnection`);
                continue; // Look for other matches or create new one
            }
            
            const existingSocket = isPlayer1 ? match.player1 : match.player2;
            
            if (existingSocket && existingSocket.readyState === 1 && existingSocket !== websocket) {
                // They have an active connection from elsewhere - reject this one
                console.log(`User ${username} already has active connection in match ${matchId}`);
                throw new Error('You are already in this match!');
            } else {
                // Their previous connection is dead or this is a reconnection - allow it
                console.log(`Allowing reconnection for ${username} to match ${matchId}`);
                return { matchId, created: false, reconnected: true };
            }
        }
    }

    // Look for an available match that has exactly 1 player and isn't created by the same user
    for(const [waitingMatchId, waitingData] of waitingPlayers)
    {
        const match = getMatch(waitingMatchId);
        if(match && match.state.connectedPlayers === 1 && !match.state.gameFinished) {
            // Make sure this isn't the same user trying to join their own match
            if (match.state.player1Username === username || match.state.player2Username === username) {
                console.log(`User ${username} trying to join their own match ${waitingMatchId}, skipping...`);
                continue;
            }
            
            console.log(`Found available match ${waitingMatchId} for ${username}`);
            console.log(`Match has ${match.state.connectedPlayers} players`);
            console.log(`Player1: ${match.state.player1Username}, Player2: ${match.state.player2Username}`);
            
            // Remove from waiting list since this match will be full
            waitingPlayers.delete(waitingMatchId);
            return { matchId: waitingMatchId, created: false };
        }
    }

    // No suitable match found, create a new one with sequential ID
    const matchId = generateMatchId();
    console.log(`Creating new match ${matchId} for ${username}`);

    await createMatchState(matchId, username, 'Player2'); // Start with username as player1
    waitingPlayers.set(matchId, { username, timestamp: Date.now() });
    
    console.log(`New match ${matchId} created and added to waiting list`);
    console.log('Updated waiting players:', Array.from(waitingPlayers.keys()));
    
    return { matchId, created: true };
}

export async function updateDashboardStats(player1Username, player2Username, winner)
{
    if (!winner || !player1Username || !player2Username)
        return;
    
    //update Winner stats
    const winnerUser = await prisma.user.findUnique({
        where: { username: winner }
    });
    if (winnerUser){
        await prisma.user.update({
            where: { username: winner },
            data: {
                gamesPlayed: winnerUser.gamesPlayed + 1,
                wins: winnerUser.wins + 1,
            }
        });
        console.log("Update winner successfully");
    }

    const loser = winner === player1Username ? player2Username : player1Username;
    const loserUser = await prisma.user.findUnique({
        where: { username: loser }
    });
    if (loserUser) {
        await prisma.user.update({
            where: { username: loser },
            data: {
                gamesPlayed: loserUser.gamesPlayed + 1,
                losses: loserUser.losses + 1,
            }
        });
        console.log("Update loser successfully");
    }
}