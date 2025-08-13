import { addPlayerToMatch, removePlayerFromMatch, getMatch} from '../services/matchStateService.js';

export function handleRemoteGame(socket, matchId){
    console.log(`Player attempting to join match ${matchId}`);
    const playerNumber = addPlayerToMatch(parseInt(matchId), socket);
        if(playerNumber === null)
        {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Match is full'
            }));
            socket.close();
            return ;
        }

        console.log(`Player ${playerNumber} has joined match ${matchId}`);
        socket.send(JSON.stringify({
            type: 'success',
            playerNumber: playerNumber,
            message: `You are player ${playerNumber}`
        }));

        const match = getMatch(parseInt(matchId));
        if(match.state.connectedPlayers === 2)
        {
            const readyMessage = JSON.stringify({
                type: 'ready',
                message: 'Both players connected! Match ready to start.'
            });
            if(match.player1)
                match.player1.send(readyMessage);
            if(match.player2)
                match.player2.send(readyMessage);
            console.log(`Match ${matchId} is ready - both players connected`);
        }

        socket.on('close', () => {
            removePlayerFromMatch(parseInt(matchId), socket);
            const remainingMatch = getMatch(parseInt(matchId));
            if(remainingMatch)
            {
                const disconnectMessage = JSON.stringify({
                   type: 'disconnect',
                   message: `Player ${playerNumber} has disconnected` 
                });
                if(remainingMatch.player1)
                    remainingMatch.player1.send(disconnectMessage);
                if(remainingMatch.player2)
                    remainingMatch.player2.send(disconnectMessage);
                console.log(`Player ${playerNumber} has disconnected`);
            }
        });
        socket.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log(`Recieved message from player ${playerNumber}: `, data);

                socket.send(JSON.stringify({
                    type: 'echo',
                    originalMessage: data
                }));
            }
            catch(error) {
                console.error('Invald message format:', error);
            }
        });
}