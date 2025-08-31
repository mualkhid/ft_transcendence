import { handleRemoteGame } from '../controller/remoteGameController.js';
import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

async function remoteGameRoutes(fastify, options) {
    fastify.get('/remote-game/:matchId', { websocket: true }, async (connection, request) => {
            await handleRemoteGame(connection, request.params.matchId);
    });
}

export default remoteGameRoutes;