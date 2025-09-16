import { handleRemoteGame } from '../controller/remoteGameController.js';
import { findorCreateMatch } from '../services/matchStateService.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function remoteGameRoutes(fastify, options) {
    console.log('Registering remote game routes with prefix:', options.prefix || 'none');
    
    // Helper function to extract username from WebSocket connection
    const extractUsername = (request) => {
        // Try to get username from query params first
        if (request.query?.username) {
            return request.query.username;
        }
        
        // Try to get from headers (if passed via token)
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = authenticate(token);
                return decoded.username;
            } catch (error) {
                console.log('Failed to authenticate token:', error.message);
            }
        }
        
        // Try to get from cookies (if using cookie-based auth)
        if (request.cookies?.token) {
            try {
                const decoded = authenticate(request.cookies.token);
                return decoded.username;
            } catch (error) {
                console.log('Failed to authenticate cookie token:', error.message);
            }
        }
        
        return 'Anonymous';
    };

    // Main matchmaking endpoint
    fastify.get('/find-match', { 
        websocket: true 
    }, async (connection, request) => {
        let socket;
        try {
            console.log('=== FIND MATCH WEBSOCKET CONNECTION ===');
            console.log('Connection object:', !!connection);
            console.log('Query params:', request.query);
            
            // Get the socket from connection
            socket = connection.socket || connection;
            
            if (!socket) {
                throw new Error('No WebSocket connection available');
            }
            
            console.log('Socket ready state:', socket.readyState);
            
            // Extract username with better authentication handling
            const username = extractUsername(request);
            console.log('Finding/creating match for user:', username);
            
            // Track user activity if we have proper authentication
            if (username !== 'Anonymous') {
                try {
                    await trackUserActivity(username);
                } catch (error) {
                    console.log('Failed to track user activity:', error.message);
                    // Don't fail the connection for this
                }
            }
            
            // Find or create match with better error handling
            let matchResult;
            try {
                matchResult = await findorCreateMatch(socket, username);
                console.log('Match result:', matchResult);
            } catch (error) {
                if (error.message === 'You are already in this match!') {
                    // Handle duplicate connection attempt
                    socket.send(JSON.stringify({
                        type: 'error',
                        message: 'You are already connected to a match. Please wait or refresh the page.'
                    }));
                    socket.close(1008, 'Duplicate connection');
                    return;
                }
                throw error;
            }
            
            const { matchId, created, reconnected } = matchResult;
            
            // Send match assignment to client
            socket.send(JSON.stringify({
                type: 'match-assigned',
                matchId: matchId,
                created: created,
                reconnected: reconnected || false
            }));
            
            // Handle the game
            await handleRemoteGame(socket, matchId, username);
            
        } catch (error) {
            console.error('Match finding error:', error);
            console.error('Error stack:', error.stack);
            
            if (socket && socket.readyState === 1) {
                socket.send(JSON.stringify({
                    type: 'error',
                    message: error.message
                }));
                socket.close(1002, error.message);
            }
        }
    });
}

export default remoteGameRoutes;