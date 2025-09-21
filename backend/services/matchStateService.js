import { 
    createMatch, 
    startMatch, 
    completeMatch,
    updatePlayer2
} from './matchDatabaseService.js';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const activeMatches = new Map();
const waitingPlayers = new Map(); 

let matchIdCounter = 1;
const generateMatchId = () => matchIdCounter++;

export async function createMatchState(matchId, player1Username = 'Player1', player2Username = 'Waiting for Player 2')
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

export async function removePlayerFromMatch(matchId, websocket)
{
    const match = activeMatches.get(matchId);
    if (!match) return null;

    let disconnectedPlayer = null;
    let disconnectedPlayerUsername = null;
    let remainingPlayerUsername = null;

    if (match.player1 === websocket)
    {
        match.player1 = null;
        match.state.connectedPlayers--;
        disconnectedPlayer = 1;
        disconnectedPlayerUsername = match.state.player1Username;
        remainingPlayerUsername = match.state.player2Username;
    }
    else if (match.player2 === websocket)
    {
        match.player2 = null;
        match.state.connectedPlayers--;
        disconnectedPlayer = 2;
        disconnectedPlayerUsername = match.state.player2Username;
        remainingPlayerUsername = match.state.player1Username;
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
        }
        if (disconnectedPlayerUsername && 
            remainingPlayerUsername && 
            disconnectedPlayerUsername !== 'Player1' && 
            disconnectedPlayerUsername !== 'Player2' &&
            remainingPlayerUsername !== 'Player1' && 
            remainingPlayerUsername !== 'Player2') {
            
            console.log(`Updating stats - Winner: ${remainingPlayerUsername}, Loser: ${disconnectedPlayerUsername}`);
            
            await updateDashboardStats(
                match.state.player1Username, 
                match.state.player2Username,
                remainingPlayerUsername
            );
        } else {
            console.log('Skipping stats update - invalid usernames detected');
            console.log(`Disconnected: "${disconnectedPlayerUsername}", Remaining: "${remainingPlayerUsername}"`);
        }
        broadcastGameOver(match, disconnectedPlayer === 1 ? 2 : 1, matchId);
        activeMatches.delete(matchId);
    }
    if (!match.player1 && !match.player2)
        activeMatches.delete(matchId);
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
    // Compute previous position for continuous collision detection
    const previousX = match.state.ballPositionX - match.state.speedX;
    const previousY = match.state.ballPositionY - match.state.speedY;

    // Left paddle collision - ball moving left and crossing paddle plane
    const leftPaddleRightEdge = match.state.leftPaddleX + match.state.paddleWidth;
    const ballLeftEdge = match.state.ballPositionX - match.state.radius;
    
    if (match.state.speedX < 0 && 
        previousX > leftPaddleRightEdge && ballLeftEdge <= leftPaddleRightEdge &&
        match.state.ballPositionY >= match.state.leftPaddleY &&
        match.state.ballPositionY <= match.state.leftPaddleY + match.state.paddleHeight) {
        
        // Clamp ball to paddle surface to prevent tunneling
        match.state.ballPositionX = leftPaddleRightEdge + match.state.radius;
        match.state.speedX = Math.abs(match.state.speedX);
        
        // Additional safety: ensure ball is not behind paddle
        if (match.state.ballPositionX < leftPaddleRightEdge) {
            match.state.ballPositionX = leftPaddleRightEdge + match.state.radius + 1;
        }
        
        addSpin(match);
    }

    // Right paddle collision - ball moving right and crossing paddle plane
    const rightPaddleLeftEdge = match.state.rightPaddleX;
    const ballRightEdge = match.state.ballPositionX + match.state.radius;
    
    if (match.state.speedX > 0 && 
        previousX < rightPaddleLeftEdge && ballRightEdge >= rightPaddleLeftEdge &&
        match.state.ballPositionY >= match.state.rightPaddleY &&
        match.state.ballPositionY <= match.state.rightPaddleY + match.state.paddleHeight) {
        
        // Clamp ball to paddle surface to prevent tunneling
        match.state.ballPositionX = rightPaddleLeftEdge - match.state.radius;
        match.state.speedX = -Math.abs(match.state.speedX);
        
        // Additional safety: ensure ball is not behind paddle
        if (match.state.ballPositionX > rightPaddleLeftEdge) {
            match.state.ballPositionX = rightPaddleLeftEdge - match.state.radius - 1;
        }
        
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
    activeMatches.delete(matchId);
}

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
    for(const [waitingMatchId, waitingData] of waitingPlayers)
    {
        const match = getMatch(waitingMatchId);
        if(match && match.state.connectedPlayers === 1 && !match.state.gameFinished)
        {
            if (match.state.player1Username === username || match.state.player2Username === username)
                continue;
            match.state.player2Username = username;
            await updatePlayer2(match.matchId, username);
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
    
    const winnerUser = await prisma.user.findUnique({
        where: { username: winner }
    });
    if (winnerUser)
    {
        await prisma.user.update({
            where: { username: winner },
            data: {
                gamesPlayed: winnerUser.gamesPlayed + 1,
                wins: winnerUser.wins + 1,
            }
        });
    }

    // Update loser stats
    const loser = winner === player1Username ? player2Username : player1Username;
    const loserUser = await prisma.user.findUnique({
        where: { username: loser }
    });
    if (loserUser)
    {
        await prisma.user.update({
            where: { username: loser },
            data: {
                gamesPlayed: loserUser.gamesPlayed + 1,
                losses: loserUser.losses + 1,
            }
        });
    }
}