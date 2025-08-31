const { 
    createGame, 
    getGameState, 
    updateGameState, 
    getUserGameHistory 
} = require('../controller/gameController');

const { 
    createGameSchema, 
    updateGameStateSchema 
} = require('../schema/gameSchema');

async function gameRoutes(fastify, options) {
    // All game routes require authentication
    fastify.post('/games', { 
        schema: createGameSchema, 
        preHandler: fastify.authenticate 
    }, createGame);
    
    fastify.get('/games/:gameId', { 
        preHandler: fastify.authenticate 
    }, getGameState);
    
    fastify.put('/games/:gameId', { 
        schema: updateGameStateSchema, 
        preHandler: fastify.authenticate 
    }, updateGameState);
    
    fastify.get('/games/history', { 
        preHandler: fastify.authenticate 
    }, getUserGameHistory);
}

module.exports = gameRoutes;
