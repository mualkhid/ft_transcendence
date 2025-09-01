import { addPlayerToQueue, removePlayerFromQueue, getQueueStatus } from '../services/matchmakingService.js';
import { authenticate } from '../services/jwtService.js';

async function matchmakingRoutes(fastify, options) {
    // WebSocket endpoint for matchmaking
    fastify.get('/matchmaking', { websocket: true }, async (connection, request) => {
        console.log('=== NEW MATCHMAKING CONNECTION ===');
        console.log('Request headers:', request.headers);
        console.log('Request cookies:', request.headers.cookie);
        
        // For now, we'll use anonymous users until we implement proper WebSocket auth
        const userId = 'anonymous_' + Date.now();
        const username = 'Anonymous_' + Math.floor(Math.random() * 1000);
        
        console.log(`User ${username} (${userId}) connected to matchmaking`);
        
        // Add player to matchmaking queue
        await addPlayerToQueue(userId, connection.socket, username);
        
        // Send initial status
        const status = getQueueStatus();
        connection.socket.send(JSON.stringify({
            type: 'queue-status',
            status: status
        }));
        
        // Handle incoming messages
        connection.socket.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('Received matchmaking message:', data);
                
                if (data.type === 'join-queue') {
                    // Update user info if provided
                    if (data.userId && data.username) {
                        console.log(`Updating user info: ${data.username} (${data.userId})`);
                        // We could store this in a map for later use
                    }
                    
                    // Send confirmation that player joined queue
                    connection.socket.send(JSON.stringify({
                        type: 'joined-queue',
                        message: 'Successfully joined matchmaking queue'
                    }));
                } else if (data.type === 'cancel-matchmaking') {
                    removePlayerFromQueue(userId);
                    connection.socket.send(JSON.stringify({
                        type: 'matchmaking-cancelled',
                        message: 'Matchmaking cancelled'
                    }));
                } else if (data.type === 'ping') {
                    connection.socket.send(JSON.stringify({
                        type: 'pong',
                        timestamp: data.timestamp
                    }));
                }
            } catch (error) {
                console.error('Error parsing matchmaking message:', error);
                // Send error response to prevent WebSocket closure
                connection.socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });
        
        // Handle disconnection
        connection.socket.on('close', (code, reason) => {
            console.log(`User ${username} (${userId}) disconnected from matchmaking. Code: ${code}, Reason: ${reason}`);
            removePlayerFromQueue(userId);
        });
        
        // Handle WebSocket errors
        connection.socket.on('error', (error) => {
            console.error(`WebSocket error for user ${username}:`, error);
        });
    });
    
    // REST endpoint to get queue status
    fastify.get('/api/matchmaking/status', async (request, reply) => {
        const status = getQueueStatus();
        return { status };
    });
}

export default matchmakingRoutes;
