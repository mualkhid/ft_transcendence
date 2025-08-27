import { handleRemoteGame } from '../controller/remoteGameController.js';

import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function remoteGameRoutes(fastify, options)
{
    fastify.get('/remote-game/:matchId', {preHandler: [authenticate, trackUserActivity]}, {websocket : true}, (socket, request) => {
        const { matchId } = request.params;
        handleRemoteGame(socket, matchId);
    });
}

export default remoteGameRoutes;