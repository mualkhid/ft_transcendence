import { 
    createMatch, 
    startMatch, 
    completeMatch,
} from './matchDatabaseService.js';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const activeMatches = new Map();
const waitingPlayers = new Map(); 

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

    if (disconnectedPlayer && !match.state.gameFinished)
    {
        if (match.state.gameLoopInterval)
        {
            clearInterval(match.state.gameLoopInterval);
            match.state.gameLoopInterval = null;
        }
        match.state.gameFinished = true;

        const remainingPlayer = disconnectedPlayer === 1 ? match.player2 : match.player1;
        const remainingPlayerUsername = disconnectedPlayer === 1 ? match.state.player2Username : match.state.player1Username;

        if (remainingPlayer && remainingPlayer.readyState === 1)
        {
            const abandonMessage = {
                type: 'game-abandoned',
                message: `Opponent disconnected. You win!`,
                winner: disconnectedPlayer === 1 ? 2 : 1,
                player1Score: match.state.scorePlayer1,
                player2Score: match.state.scorePlayer2,
                player1Username: match.state.player1Username,
                player2Username: match.state.player2Username,
                winnerAlias: remainingPlayerUsername
            };
            remainingPlayer.send(JSON.stringify(abandonMessage));
            console.log('Sent win-by-disconnect message to remaining player.');
        }
        activeMatches.delete(matchId);
        console.log(`Match ${matchId} deleted from memory after cleanup.`);
        //check if necessary to update stats on disconnect
        updateDashboardStats(
            match.state.player1Username, 
            match.state.player2Username,
            remainingPlayerUsername
        ).catch(error => {
            console.error(`Failed to update dashboard stats after disconnect: ${error.message}`);
        });
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

    if (match.state.gameFinished)
    {
        if (match.state.gameLoopInterval)
        {
            clearInterval(match.state.gameLoopInterval);
            match.state.gameLoopInterval = null;
        }
        return null;
    }

    // Check if both players are still connected
    if (match.state.connectedPlayers < 2)
    {
        if (match.state.gameLoopInterval)
        {
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
    if (match.state.gameFinished)
    {
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

    if (match.state.gameLoopInterval)
    {
        clearInterval(match.state.gameLoopInterval);
        match.state.gameLoopInterval = null;
    }
    
    // Mark as finished
    match.state.gameFinished = true;
    
    console.log(`Game over broadcast complete for match ${matchId}`);
}

// Fixed findOrCreateMatch to prevent reconnection to finished games
export async function findorCreateMatch(websocket, username)
{
    for (const [matchId, match] of activeMatches)
    {
        const isPlayer1 = match.state.player1Username === username;
        const isPlayer2 = match.state.player2Username === username;
        
        if (isPlayer1 || isPlayer2)
        {
            if (match.state.gameFinished)
                continue;
            const existingSocket = isPlayer1 ? match.player1 : match.player2;
            
            if (existingSocket && existingSocket.readyState === 1 && existingSocket !== websocket)
                throw new Error('You are already in this match!');
            else
                return { matchId, created: false, reconnected: true };
        }
    }

    // Look for an available match that has exactly 1 player and isn't created by the same user
    for(const [waitingMatchId, waitingData] of waitingPlayers)
    {
        const match = getMatch(waitingMatchId);
        if(match && match.state.connectedPlayers === 1 && !match.state.gameFinished)
        {
            if (match.state.player1Username === username || match.state.player2Username === username)
                continue;
            waitingPlayers.delete(waitingMatchId);
            return { matchId: waitingMatchId, created: false };
        }
    }
    const matchId = generateMatchId();
    await createMatchState(matchId, username, 'Player2');
    waitingPlayers.set(matchId, { username, timestamp: Date.now() });
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