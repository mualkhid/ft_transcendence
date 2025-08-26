export const  createTournamentSchema = {
    body: {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 3 },
                aliases: { type: 'array',
                        items: {type: 'string', minLength: 1 },
                        minItems: 4,
                        maxItems: 8
                 }
            },
            required: ['aliases'],
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