import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const fastify = Fastify();

// Register WebSocket support
await fastify.register(fastifyWebsocket);

// Simple matchmaking endpoint
fastify.get('/api/matchmaking', { websocket: true }, async (connection, request) => {
    // Test matchmaking connection established
    
    const userId = 'test_' + Date.now();
    const username = 'TestUser_' + Math.floor(Math.random() * 1000);
    
    // User connected to test matchmaking
    
    // Send initial status
    connection.socket.send(JSON.stringify({
        type: 'queue-status',
        status: { waitingPlayers: 1 }
    }));
    
    // Handle incoming messages
    connection.socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Received test message
            
            if (data.type === 'join-queue') {
                // User joined queue
                
                // Send confirmation
                connection.socket.send(JSON.stringify({
                    type: 'joined-queue',
                    message: 'Successfully joined test queue'
                }));
                
                // Simulate match found after 2 seconds
                setTimeout(() => {
                    const matchFoundMessage = JSON.stringify({
                        type: 'match-found',
                        matchId: 1,
                        message: 'Test match found!'
                    });
                    connection.socket.send(matchFoundMessage);
                    // Sent test match-found message
                }, 2000);
            }
        } catch (error) {
            console.error('Error parsing test message:', error);
        }
    });
    
    // Handle disconnection
    connection.socket.on('close', (code, reason) => {
        // Test user disconnected
    });
    
    // Handle errors
    connection.socket.on('error', (error) => {
        console.error(`Test WebSocket error for ${username}:`, error);
    });
});

// Simple game endpoint
fastify.get('/api/remote-game/:matchId', { websocket: true }, async (connection, request) => {
    // Test game connection established
    
    const playerNumber = Math.floor(Math.random() * 2) + 1;
    
    // Send success message
    const successMessage = JSON.stringify({
        type: 'success',
        playerNumber: playerNumber,
        message: `You are player ${playerNumber}`,
        player1Username: 'TestPlayer1',
        player2Username: 'TestPlayer2'
    });
    
    connection.socket.send(successMessage);
    // Sent test success message
    
    // Handle messages
    connection.socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Received test game message
            
            // Echo back the message
            connection.socket.send(JSON.stringify({
                type: 'echo',
                originalMessage: data
            }));
        } catch (error) {
            console.error('Error parsing test game message:', error);
        }
    });
    
    // Handle disconnection
    connection.socket.on('close', (code, reason) => {
        // Test game connection closed
    });
});

// Start server
try {
    const address = await fastify.listen({ port: 3001, host: '0.0.0.0' });
    // Test WebSocket server running
} catch (err) {
    fastify.log.error("Test server error:", err);
    process.exit(1);
}
