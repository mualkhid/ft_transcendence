import { handleRemoteGame } from '../controller/remoteGameController.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function remoteGameRoutes(fastify, options) {
    // Main remote game route using the sophisticated state service
    fastify.get('/remote-game/:matchId', { websocket: true }, async (connection, request) => {
        console.log('🔌 WebSocket connection attempt:', {
            matchId: request?.params?.matchId || 'undefined',
            username: request?.query?.username || null,
            hasSocket: !!connection.socket,
            socketType: typeof connection.socket,
            connectionKeys: Object.keys(connection),
            requestKeys: request ? Object.keys(request) : 'request is undefined'
        });
        
        // Check if this is a WebSocket upgrade request
        if (!connection.socket) {
            console.error('❌ No WebSocket connection available');
            return;
        }
        
        // Check if request params are available
        if (!request || !request.params || !request.params.matchId) {
            console.error('❌ Invalid request parameters');
            if (connection.socket && connection.socket.readyState === 1) {
                connection.socket.close(1002, 'Invalid request parameters');
            }
            return;
        }
        
        try {
            const username = request.query?.username || null;
            console.log('✅ WebSocket connection established, calling handleRemoteGame');
            await handleRemoteGame(connection.socket, request.params.matchId, username);
        } catch (error) {
            console.error('❌ Error in remote game route:', error);
            if (connection.socket && connection.socket.readyState === 1) {
                connection.socket.close(1011, 'Internal server error');
            }
        }
    });
    
    // Simple remote game route (alternative implementation)
    fastify.get('/simple-remote/:matchId', { websocket: true }, async (connection, request) => {
        console.log('🔌 Simple remote game connection attempt');
        
        if (!connection.socket) {
            console.error('❌ No WebSocket connection available');
            return;
        }
        
        try {
            const matchId = request.params.matchId;
            const username = request.query?.username || 'Anonymous';
            
            console.log('✅ Simple WebSocket connection established');
            console.log('📝 Match ID:', matchId, 'Username:', username);
            
            // Import the simple handler from controller
            const { handleSimpleRemoteGame } = await import('../controller/remoteGameController.js');
            handleSimpleRemoteGame(connection.socket, request);
            
        } catch (error) {
            console.error('❌ Error in simple remote game:', error);
            if (connection.socket && connection.socket.readyState === 1) {
                connection.socket.close(1011, 'Internal server error');
            }
        }
    });

    // Add a simple test route to verify WebSocket is working
    fastify.get('/test-ws', { websocket: true }, async (connection, request) => {
        console.log('🧪 Test WebSocket connection');
        if (connection.socket) {
            connection.socket.send(JSON.stringify({ type: 'test', message: 'WebSocket is working!' }));
            console.log('✅ Test WebSocket sent message');
        } else {
            console.log('❌ Test WebSocket failed');
        }
    });
}

export default remoteGameRoutes;