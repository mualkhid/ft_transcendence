import { 
    createMatch, 
    startMatch, 
    completeMatch,
    // updatePlayer2
} from './matchDatabaseService.js';

import { prisma } from '../prisma/prisma_lib.js';

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
        const matchState = {
            player1: null,
            player2: null,
            matchId: null,
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
                powerUps: [],
                powerUpSpawnTimer: 0,
                powerUpsSpawned: 0,
                maxPowerUpsPerGame: 2,
                powerupsEnabled: false,
                player1PowerupsPreference: null,
                player2PowerupsPreference: null
            }
        };
        
        activeMatches.set(numericMatchId, matchState);
        return matchState;
    }
    return activeMatches.get(numericMatchId);
}

export function updatePlayerPowerupsPreference(matchId, playerNumber, enabled)
{
    const match = getMatch(matchId);
    if (!match)
        return null;

    if (playerNumber === 1)
        match.state.player1PowerupsPreference = enabled;
    else if (playerNumber === 2)
        match.state.player2PowerupsPreference = enabled;

    // Update overall powerups setting - only enable if BOTH players want it
    if (match.state.player1PowerupsPreference !== null && match.state.player2PowerupsPreference !== null)
        match.state.powerupsEnabled = match.state.player1PowerupsPreference && match.state.player2PowerupsPreference;

    return {
        player1Preference: match.state.player1PowerupsPreference,
        player2Preference: match.state.player2PowerupsPreference,
        finalSetting: match.state.powerupsEnabled
    };
}

function updatePowerUps(match) {
    if (!match.state.powerupsEnabled) return;
    
    // Spawn power-ups (max 2 per game total)
    if (match.state.powerUpsSpawned < match.state.maxPowerUpsPerGame && match.state.powerUps.length === 0 && Math.random() < 0.1)
    {
        const powerUp = {
            x: Math.random() * (match.state.canvasWidth - 30),
            y: Math.random() * (match.state.canvasHeight - 30),
            width: 25,
            height: 25,
            type: 'point',
            active: true,
            duration: 600 // 10 seconds at 60fps
        };
        
        match.state.powerUps.push(powerUp);
        match.state.powerUpsSpawned++;
    }
    
    // Update existing power-ups (decrease duration)
    match.state.powerUps = match.state.powerUps.filter(powerUp => {
        powerUp.duration--;
        return powerUp.duration > 0;
    });
    
    // Check ball collision with power-ups
    match.state.powerUps.forEach((powerUp, index) => {
        const ballX = match.state.ballPositionX;
        const ballY = match.state.ballPositionY;
        const ballRadius = match.state.radius;
        
        if (ballX + ballRadius > powerUp.x && ballX - ballRadius < powerUp.x + powerUp.width && ballY + ballRadius > powerUp.y &&
            ballY - ballRadius < powerUp.y + powerUp.height)
        {
            if (match.state.speedX > 0)
                match.state.scorePlayer1++;
            else
                match.state.scorePlayer2++;
            match.state.powerUps.splice(index, 1);
        }
    });
}

export async function addPlayerToMatch(matchId, websocket, username = null)
{
    const match = await createMatchState(matchId);
    
    if(!match) 
        return null;
    
    if (match.state.gameFinished)
        return null;

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
        const dbMatch = await createMatch(
            match.state.player1Username, 
            match.state.player2Username, 
            matchId
        );
        match.matchId = dbMatch.id;
        return (2);
    }
    return (null);
}

export async function removePlayerFromMatch(matchId, websocket)
{
    const match = activeMatches.get(matchId);
    if (!match) return null;

    let disconnectedPlayer = null;
    let remainingPlayerUsername = null;

    if (match.player1 === websocket)
    {
        match.player1 = null;
        match.state.connectedPlayers--;
        disconnectedPlayer = 1;
        remainingPlayerUsername = match.state.player2Username;
    }
    else if (match.player2 === websocket)
    {
        match.player2 = null;
        match.state.connectedPlayers--;
        disconnectedPlayer = 2;
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
            ('🔍 Processing disconnection:');
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
        await updateDashboardStats(
            match.state.player1Username, 
            match.state.player2Username,
            remainingPlayerUsername
        );
        if (match.matchId)
        {
            await completeMatch(
                match.matchId, 
                remainingPlayerUsername,
                disconnectedPlayer === 1 ? match.state.scorePlayer2 : match.state.scorePlayer1,
                disconnectedPlayer === 1 ? match.state.scorePlayer1 : match.state.scorePlayer2
            );
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

    if (match.state.gameFinished) 
        return null; 

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
    updatePowerUps(match);
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
        return;

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
        player2Username: match.state.player2Username,
        powerUps: match.state.powerUps
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

export async function findorCreateMatch(websocket, username, powerupsEnabled = true)
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
            {
                const playerNumber = isPlayer1 ? 1 : 2;
                updatePlayerPowerupsPreference(matchId, playerNumber, powerupsEnabled);
                return { matchId, created: false, reconnected: true };
            }
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
            updatePlayerPowerupsPreference(waitingMatchId, 2, powerupsEnabled);
            waitingPlayers.delete(waitingMatchId);
            return { matchId: waitingMatchId, created: false };
        }
    }
    const matchId = generateMatchId();
    await createMatchState(matchId, username, 'Player2');
    updatePlayerPowerupsPreference(matchId, 1, powerupsEnabled);
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