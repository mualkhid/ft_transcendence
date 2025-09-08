import { handleRemoteGame } from '../controller/remoteGameController.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function remoteGameRoutes(fastify, options) {
    fastify.get('/remote-game/:matchId', { websocket: true }, async (connection, request) => {
        
        // Check if this is a WebSocket upgrade request
        if (!connection.socket) {
            console.error('❌ No WebSocket connection available');
            return;
        }
        
        // Check if request params are available
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
        
        try {
            const matchId = request.params.matchId;
            const username = request.query?.username || null;
            
            console.log(`Fastify route - matchId: "${matchId}", username: "${username}"`);
            
            // Validate matchId
            if (!matchId || isNaN(parseInt(matchId))) {
                console.error(`Invalid matchId in Fastify route: "${matchId}"`);
                connection.socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid match ID format'
                }));
                connection.socket.close(1002, 'Invalid match ID');
                return;
            }
            
            // Pass the correct parameters: socket, matchId (as string), username
            await handleRemoteGame(connection.socket, matchId, username);
        } catch (error) {
            console.error('Error in remoteGameRoutes:', error);
            if (connection.socket && connection.socket.readyState === 1) {
                connection.socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Internal server error occurred'
                }));
                connection.socket.close(1011, 'Internal server error');
            }
        }
    });
}

export default remoteGameRoutes;