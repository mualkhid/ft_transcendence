import { handleRemoteGame } from '../controller/remoteGameController.js';
import { findorCreateMatch } from '../services/matchStateService.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function remoteGameRoutes(fastify, options) {
    
    fastify.get('/find-match', { websocket: true }, async (connection, request) => {
        const extractUsername = (request) => {
            if (request.query?.username)
                return request.query.username;
        };
        const extractPowerupsPreference = (request) => {
            if (request.query?.powerups !== undefined) {
                return request.query.powerups === 'true';
            }
            return true;
        };
        let socket = connection.socket || connection;
        
        if (!socket)
        {
            console.error('No WebSocket connection available');
            return;
        }

        try
        {
            const username = extractUsername(request);
            const powerupsEnabled = extractPowerupsPreference(request);
            try
            {
                await trackUserActivity(username);
            }
            catch (activityError)
            {
                console.error('Failed to track user activity:', activityError.message);
            }

            let matchResult;
            try
            {
                matchResult = await findorCreateMatch(socket, username, powerupsEnabled);
            }
            catch (matchError)
            {
                console.error('Error in findorCreateMatch:', matchError);
                
                if (matchError.message === 'You are already in this match!')
                {
                    if (socket.readyState === 1) {
                        socket.send(JSON.stringify({
                            type: 'error',
                            message: 'You are already connected to a match. Please wait or refresh the page.'
                        }));
                        socket.close(1008, 'Duplicate connection');
                    }
                    return;
                }
                
                if (socket.readyState === 1)
                {
                    socket.send(JSON.stringify({
                        type: 'error',
                        message: matchError.message || 'Failed to find or create match'
                    }));
                    socket.close(1002, 'Match error');
                }
                return;
            }

            const { matchId, created, reconnected } = matchResult;

            if (socket.readyState === 1)
            {
                socket.send(JSON.stringify({
                    type: 'match-assigned',
                    matchId: matchId,
                    created: created,
                    reconnected: reconnected || false
                }));
            }

            try
            {
                await handleRemoteGame(socket, matchId, username, powerupsEnabled);
            }
            catch (gameError)
            {
                console.error('Error in handleRemoteGame:', gameError);
                if (socket.readyState === 1) {
                    socket.send(JSON.stringify({
                        type: 'error',
                        message: gameError.message || 'Game handling error'
                    }));
                    socket.close(1011, 'Game error');
                }
            }

        }
        catch (generalError)
        {
            console.error('General error in find-match route:', generalError);
            if (socket && socket.readyState === 1) {
                socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Internal server error'
                }));
                socket.close(1011, 'Internal error');
            }
        }
    });
}

export default remoteGameRoutes;