const activeMatches = new Map();

export function createMatchState(matchId){
    if(!activeMatches.has(matchId)){
        activeMatches.set(matchId, {
            player1: null,
            player2: null,
            state: {
                status: 'waiting',
                connectedPlayers: 0,
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
                gameLoopInterval: null
            }
        });
    }
    return activeMatches.get(matchId);
}

export function addPlayerToMatch(matchId, websocket){
    const match = createMatchState(matchId);

    if(!match.player1)
    {
        match.player1 = websocket;
        match.state.connectedPlayers++;
        return (1);
    }
    if(!match.player2)
    {
        match.player2 = websocket;
        match.state.connectedPlayers++;
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
        clearInterval(match.state.gameLoopInterval);
        match.state.gameLoopInterval = null;
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

    //Player 1
    if(match.state.player1Keys.up === true)
    {
        match.state.leftPaddleY = Math.max(0, match.state.leftPaddleY - paddleSpeed);
    }
    if(match.state.player1Keys.down === true)
    {
        match.state.leftPaddleY = Math.min(match.state.canvasHeight - match.state.paddleHeight, match.state.leftPaddleY + paddleSpeed);
    }

    //Player2
    if(match.state.player2Keys.up === true)
    {
        match.state.rightPaddleY = Math.max(0, match.state.rightPaddleY - paddleSpeed);
    }
    if(match.state.player2Keys.down === true)
    {
        match.state.rightPaddleY = Math.min(match.state.canvasHeight - match.state.paddleHeight, match.state.rightPaddleY + paddleSpeed);
    }
}

export function updateBall(matchId)
{
    const match = getMatch(matchId);
    if(!match)
        return (null);
    updatePaddlePosition(match);
    match.state.ballPositionX += match.state.speedX;
    match.state.ballPositionY += match.state.speedY;

    // Bounce top/bottom
    if (match.state.ballPositionY - match.state.radius <= 0 || match.state.ballPositionY + match.state.radius >= match.state.canvasHeight) {
        match.state.speedY *= -1;
    }
    if (match.state.ballPositionX - match.state.radius <= 0) {
        match.state.scorePlayer2++;
        if(match.state.scorePlayer2 >= match.state.maxScore)
        {
            broadcastGameOver(match, 2, matchId);
            return ;
        }
        resetBall(match);
        broadcastGameState(match);
    }
    if (match.state.ballPositionX + match.state.radius  >= match.state.canvasWidth) {
        match.state.scorePlayer1++;
        if(match.state.scorePlayer1 >= match.state.maxScore)
        {
            broadcastGameOver(match, 1, matchId);
            return ;
        }
        resetBall(match);
        broadcastGameState(match);
    }
    checkCollisions(match);
    broadcastGameState(match);
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
        player2Score: match.state.scorePlayer2
    });
    if(match.player1)
        match.player1.send(gameUpdate);
    if(match.player2)
        match.player2.send(gameUpdate);
}

function broadcastGameOver(match, winner, matchId)
{
    const gameOver = JSON.stringify({
        type: 'game-over',
        winner: winner,
        player1Score: match.state.scorePlayer1,
        player2Score: match.state.scorePlayer2
    });
    if(match.player1)
        match.player1.send(gameOver);
    if(match.player2)
        match.player2.send(gameOver);
    clearInterval(match.state.gameLoopInterval);
    match.state.gameLoopInterval = null;
    activeMatches.delete(matchId);
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