import { 
    createMatch, 
    startMatch, 
    completeMatch 
} from './matchDatabaseService.js';

const activeMatches = new Map();

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
                    readyState: 0,
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

export function removePlayerFromMatch(matchId, websocket)
{
    const match = activeMatches.get(matchId);
    if(!match)
        return (null);
    if(match.player1 === websocket)
    {
        match.player1 = null;
        match.state.connectedPlayers--;
    }
    else if(match.player2 === websocket)
    {
        match.player2 = null;
        match.state.connectedPlayers--;
    }
    if(match.state.connectedPlayers === 0)
    {
        if (match.state.gameLoopInterval)
        {
            clearInterval(match.state.gameLoopInterval);
            match.state.gameLoopInterval = null;
        }
        activeMatches.delete(matchId);
    }
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

//check frontend implementation
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
        console.log(`🏆 Player 2 scored! Score: ${match.state.scorePlayer1} - ${match.state.scorePlayer2}`);
        
        if(match.state.scorePlayer2 >= match.state.maxScore)
        {
            console.log(`🎯 GAME OVER! Player 2 wins with score ${match.state.scorePlayer2}`);
            
            // Stop the game loop BEFORE any async operations
            if (match.state.gameLoopInterval)
            {
                clearInterval(match.state.gameLoopInterval);
                match.state.gameLoopInterval = null;
                console.log(`🛑 Game loop stopped for match ${matchId}`);
            }
            
            // Set game as finished to prevent further processing
            match.state.gameFinished = true;
            console.log(`🏁 Game marked as finished for match ${matchId}`);
            
            try {
                console.log(`📊 Updating dashboard stats...`);
                await updateDashboardStats(
                    match.state.player1Username, 
                    match.state.player2Username,
                    match.state.player2Username
                );
                console.log(`✅ Dashboard stats updated successfully`);
            } catch (error) {
                console.error(`❌ Error updating dashboard stats:`, error);
            }
            
            try {
                console.log(`🎮 Broadcasting game over message...`);
                await broadcastGameOver(match, 2, matchId);
                console.log(`✅ Game over message broadcasted successfully`);
            } catch (error) {
                console.error(`❌ Error broadcasting game over:`, error);
            }
            
            return;
        }
        resetBall(match);
        broadcastGameState(match);
    }
    
    if (match.state.ballPositionX + match.state.radius >= match.state.canvasWidth) {
        match.state.scorePlayer1++;
        console.log(`🏆 Player 1 scored! Score: ${match.state.scorePlayer1} - ${match.state.scorePlayer2}`);
        
        if(match.state.scorePlayer1 >= match.state.maxScore)
        {
            console.log(`🎯 GAME OVER! Player 1 wins with score ${match.state.scorePlayer1}`);
            
            // Stop the game loop BEFORE any async operations
            if (match.state.gameLoopInterval)
            {
                clearInterval(match.state.gameLoopInterval);
                match.state.gameLoopInterval = null;
                console.log(`🛑 Game loop stopped for match ${matchId}`);
            }
            
            // Set game as finished to prevent further processing
            match.state.gameFinished = true;
            console.log(`🏁 Game marked as finished for match ${matchId}`);
            
            try {
                console.log(`📊 Updating dashboard stats...`);
                await updateDashboardStats(
                    match.state.player1Username, 
                    match.state.player2Username, 
                    match.state.player1Username
                );
                console.log(`✅ Dashboard stats updated successfully`);
            } catch (error) {
                console.error(`❌ Error updating dashboard stats:`, error);
            }
            
            try {
                console.log(`🎮 Broadcasting game over message...`);
                await broadcastGameOver(match, 1, matchId);
                console.log(`✅ Game over message broadcasted successfully`);
            } catch (error) {
                console.error(`❌ Error broadcasting game over:`, error);
            }
            
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
    //check ready state
    if(match.player1 && match.player1.readyState === 1)
        match.player1.send(gameUpdate);
    if(match.player2 && match.player2.readyState === 1)
        match.player2.send(gameUpdate);
}

async function broadcastGameOver(match, winner, matchId)
{
    console.log(`🚀 Starting broadcastGameOver for match ${matchId}, winner: ${winner}`);
    
    const winnerUsername = winner === 1 ? match.state.player1Username : match.state.player2Username;
    console.log(`Winner username: ${winnerUsername}`);
    
    const gameOverData = {
        type: 'game-over',
        winner: winner,
        winnerAlias: winnerUsername,
        player1Score: match.state.scorePlayer1,
        player2Score: match.state.scorePlayer2,
        player1Username: match.state.player1Username,
        player2Username: match.state.player2Username
    };
    
    const gameOver = JSON.stringify(gameOverData);
    console.log(`📨 Game over message prepared: ${gameOver}`);
    
    // Check WebSocket states before sending
    console.log(`🔌 WebSocket states - Player1: ${match.player1?.readyState}, Player2: ${match.player2?.readyState}`);
    
    // Send to player 1
    if(match.player1 && match.player1.readyState === 1) {
        try {
            console.log(`📤 Sending game over to player 1...`);
            match.player1.send(gameOver);
            console.log(`✅ Game over message sent to player 1 successfully`);
        } catch (error) {
            console.error(`❌ Error sending game over to player 1:`, error);
        }
    } else {
        console.log(`⚠️  Player 1 WebSocket not ready (state: ${match.player1?.readyState})`);
    }
    
    // Send to player 2
    if(match.player2 && match.player2.readyState === 1) {
        try {
            console.log(`📤 Sending game over to player 2...`);
            match.player2.send(gameOver);
            console.log(`✅ Game over message sent to player 2 successfully`);
        } catch (error) {
            console.error(`❌ Error sending game over to player 2:`, error);
        }
    } else {
        console.log(`⚠️  Player 2 WebSocket not ready (state: ${match.player2?.readyState})`);
    }
    
    // Update database
    if (match.matchId) {
        try {
            console.log(`💾 Updating database for match ${match.matchId}...`);
            await completeMatch(
                match.matchId, 
                winnerUsername, 
                match.state.scorePlayer1, 
                match.state.scorePlayer2
            );
            console.log(`✅ Match ${match.matchId} completed in database successfully`);
        } catch (error) {
            console.error(`❌ Failed to complete match ${match.matchId} in database:`, error);
        }
    }
    
    // Clean up game loop
    if (match.state.gameLoopInterval) {
        clearInterval(match.state.gameLoopInterval);
        match.state.gameLoopInterval = null;
        console.log(`🛑 Game loop interval cleared`);
    }
    
    // Wait before cleanup to ensure messages are processed
    console.log(`⏳ Waiting 3 seconds before cleanup...`);
    setTimeout(() => {
        try {
            console.log(`🧹 Starting cleanup for match ${matchId}...`);
            
            // Check if connections are still open before attempting to close
            if(match.player1 && match.player1.readyState === 1) {
                try {
                    console.log(`🔒 Closing player 1 connection gracefully...`);
                    match.player1.close(1000, 'Game completed normally');
                } catch (error) {
                    console.error(`❌ Error closing player 1 connection:`, error);
                }
            }
            
            if(match.player2 && match.player2.readyState === 1) {
                try {
                    console.log(`🔒 Closing player 2 connection gracefully...`);
                    match.player2.close(1000, 'Game completed normally');
                } catch (error) {
                    console.error(`❌ Error closing player 2 connection:`, error);
                }
            }
            
            // Clean up match after connections are closed
            setTimeout(() => {
                try {
                    console.log(`🗑️  Deleting match ${matchId} from active matches...`);
                    activeMatches.delete(matchId);
                    console.log(`✅ Match ${matchId} deleted successfully`);
                } catch (error) {
                    console.error(`❌ Error deleting match ${matchId}:`, error);
                }
            }, 1000);
            
        } catch (error) {
            console.error(`❌ Error during cleanup for match ${matchId}:`, error);
        }
    }, 3000);
    
    console.log(`🏁 broadcastGameOver completed for match ${matchId}`);
}

async function updateDashboardStats(player1Username, player2Username, winner)
{
    console.log(`📊 Starting updateDashboardStats...`);
    console.log(`Player1: ${player1Username}, Player2: ${player2Username}, Winner: ${winner}`);
    
    if (!winner || !player1Username || !player2Username) {
        console.error(`❌ Missing required parameters for stats update`);
        return;
    }
    
    try {
        console.log(`📈 Updating winner stats for: ${winner}`);
        const winnerResponse = await fetch(`https://localhost/api/users/update-stats`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: winner,
                gamesPlayed: 1,
                wins: 1,
                losses: 0
            })
        });
        
        if (!winnerResponse.ok) {
            console.error(`❌ Winner stats update failed: ${winnerResponse.status} ${winnerResponse.statusText}`);
        } else {
            console.log(`✅ Winner stats updated successfully`);
        }
        
        // Update loser stats
        const loser = winner === player1Username ? player2Username : player1Username;
        console.log(`📉 Updating loser stats for: ${loser}`);
        
        const loserResponse = await fetch(`https://localhost/api/users/update-stats`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: loser,
                gamesPlayed: 1,
                wins: 0,
                losses: 1
            })
        });
        
        if (!loserResponse.ok) {
            console.error(`❌ Loser stats update failed: ${loserResponse.status} ${loserResponse.statusText}`);
        } else {
            console.log(`✅ Loser stats updated successfully`);
        }
        
        console.log(`✅ Dashboard stats update completed`);
        
    } catch (error) {
        console.error(`❌ Error in updateDashboardStats:`, error);
        // Don't throw the error - we don't want stats update failure to break the game
    }
}


//why we need this
export function getActiveMatchesInfo()
{
    const matches = Array.from(activeMatches.entries()).map(([matchId, match]) => ({
        matchId,
        connectedPlayers: match.state.connectedPlayers,
        status: match.state.status,
        player1: match.state.player1Username,
        player2: match.state.player2Username,
        scores: {
            player1: match.state.scorePlayer1,
            player2: match.state.scorePlayer2
        },
        gameActive: !!match.state.gameLoopInterval
    }));
    
    return {
        totalActiveMatches: activeMatches.size,
        matches
    };
}
