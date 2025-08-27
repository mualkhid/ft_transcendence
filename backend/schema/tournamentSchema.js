export const  createTournamentSchema = {
    body: {
        type: 'object',
        properties: {
            name: { 
                type: 'string', 
                minLength: 1,
                maxLength: 100 
            },
            aliases: { 
                type: 'array',
                items: { 
                    type: 'string', 
                    minLength: 1,
                    maxLength: 50
                },
                minItems: 4,
                maxItems: 8
            }
        },
        required: ['aliases'],
        additionalProperties: false
    }
};
export const completeMatchSchema = {
    body: {
        type: 'object',
        properties: {
            matchId: { 
                type: 'number',
                minimum: 1
            },
            winner: { 
                type: 'string', 
                minLength: 1,
                maxLength: 50
            }
        },
        required: ['matchId', 'winner'],
        additionalProperties: false
    }
};