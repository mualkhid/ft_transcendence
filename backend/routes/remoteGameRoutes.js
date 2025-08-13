import { handleRemoteGame } from '../controller/remoteGameController.js';

async function remoteGameRoutes(fastify, options)
{
    fastify.get('/ws/game/:matchId', {websocket : true}, (socket, request) => {
        const { matchId } = request.params;
        handleRemoteGame(socket, matchId);
    });
}

export default remoteGameRoutes;