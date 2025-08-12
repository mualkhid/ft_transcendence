const  createTournamentSchema = {
    response: {
        201: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                message: { type: 'string' },
            },
            required: ['id', 'name', 'message']
        }
    }
}

const getTournamentSchema = {
    response: {
        200: {
            type: 'object',
            properties: {
                id: { type: 'number'},
                name: { type: 'string'}
            },
            required: ['id', 'name']
        },
        404: {
            type: 'object',
            properties: {
                error: {type: 'string'}
            },
            required: ['error']
        }
    }
}

const joinTournamentSchema = {
    body:{
        type: 'object',
        properties: {userId: {type: 'number'}},
        required: ['userId'],
    },
    response: {
        200: {
            type: 'object',
            properties: { message: {type: 'string'}},
            required: ['message']
        },
        400: {
            type: 'object',
            properties: { error: {type: 'string'}},
            required: ['error']
        },
        403: {
            type: 'object',
            properties: { error: {type: 'string'}},
            required: ['error']
        },
        404: {
            type: 'object',
            properties: { error: {type: 'string'}},
            required: ['error']
        },
        409: {
            type: 'object',
            properties: { error: {type: 'string'}},
            required: ['error']
        }
    }
}

const nextMatchSchema = {
    response: {
        200: {
            type: 'object',
            properties: {
              matchId: { type: 'number' },
              player1: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  alias: { type: 'string' }
                },
                required: ['id', 'alias']
              },
              player2: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  alias: { type: 'string' }
                },
                required: ['id', 'alias']
              }
            },
            required: ['matchId', 'player1', 'player2']
          },
        400: {
            type: 'object',
            properties: { error: {type: 'string'}},
            required: ['error']
        },
        404: {
            type: 'object',
            properties: { error: {type: 'string'}},
            required: ['error']
        }
    }
}

const resetTournamentSchema = {
    response: {
        200: {
            type: 'object',
            properties: { message: {type: 'string'}},
            required: ['message']
        }
    }
}

module.exports = {
    createTournamentSchema,
    getTournamentSchema,
    joinTournamentSchema,
    nextMatchSchema,
    resetTournamentSchema
}