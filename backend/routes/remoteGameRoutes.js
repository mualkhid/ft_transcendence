import { handleRemoteGame } from '../controller/remoteGameController.js';

async function remoteGameRoutes(fastify, options) {
    fastify.get('/remote-game/:matchId', { websocket: true }, async (connection, request) => {
            await handleRemoteGame(connection, request.params.matchId);
    });
}

export default remoteGameRoutes;