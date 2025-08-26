export const  createTournamentSchema = {
    body: {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 3 },
                maxPlayers: { type: 'number', enum: [4, 8] },
                aliases: { type: 'array',
                        items: {type: 'string', minLength: 1 },
                        minItems: 4,
                        maxItems: 8
                 }
            },
            required: ['alaises'],
        }
};

export const completeMatchSchema = {
    body: {
        type: 'object',
        properties: {
            matchId: { type: 'number' },
            winner: { type: 'string', minLength: 1 }
        },
        required: ['matchId', 'winner'],
    }
};
