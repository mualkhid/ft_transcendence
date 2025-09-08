import { handleRemoteGame } from '../controller/remoteGameController.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function remoteGameRoutes(fastify, options) {
    fastify.get('/remote-game/:matchId', { websocket: true }, async (connection, request) => {
        
        if (!connection.socket)
        {
            console.error('No WebSocket connection available');
            return;
        }
        if (!request || !request.params || !request.params.matchId) {
            if (connection.socket.readyState === 1) {
                connection.socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid request - missing match ID'
                }));
                connection.socket.close(1002, 'Invalid request parameters');
            }
            return;
        }
    
        const matchId = request.params.matchId;
        const username = request.query?.username || null;

        if (!matchId || matchId === 'remote-game' || isNaN(parseInt(matchId))) {
            console.error(`Invalid matchId in remote game route: "${matchId}"`);
            connection.socket.send(JSON.stringify({
                type: 'error',
                message: 'Invalid match ID format'
            }));
            connection.socket.close(1002, 'Invalid match ID');
            return;
        }
            
        await handleRemoteGame(connection.socket, matchId, username);
});
}

export default remoteGameRoutes;