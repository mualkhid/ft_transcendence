const createGameSchema = {
    body: {
        type: 'object',
        required: ['gameType', 'player1Id'],
        properties: {
            gameType: { 
                type: 'string', 
                enum: ['1v1', '1vAI', 'online', 'tournament']
            },
            player1Id: { type: 'number' },
            player2Id: { type: 'number' }
        }
    },
    response: {
        201: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                gameId: { type: 'number' },
                gameState: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        gameType: { type: 'string' },
                        player1Id: { type: 'number' },
                        player2Id: { type: 'number' },
                        status: { type: 'string' },
                        ball: { type: 'object' },
                        paddles: { type: 'object' },
                        scores: { type: 'object' }
                    }
                }
            }
        }
    }
};

const updateGameStateSchema = {
    body: {
        type: 'object',
        required: ['playerId', 'action', 'key'],
        properties: {
            playerId: { type: 'number' },
            action: { 
                type: 'string', 
                enum: ['paddle_move']
            },
            key: { 
                type: 'string', 
                enum: ['up', 'down', 'stop']
            }
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                gameState: { type: 'object' }
            }
        }
    }
};

module.exports = {
    createGameSchema,
    updateGameStateSchema
};
