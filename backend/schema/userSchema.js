export const registerSchema = {
    body: {
        type: 'object',
        required: ['alias'],
        properties: {
            alias: { type: 'string', minLength: 3, maxLength: 20 }
        }
    },
    response: {
        201: {
            type: 'object',
            properties: {
                id: { type : 'number'},
                alias: { type: 'string'}
            },
            required: ['id', 'alias']
        },
    }
};

export const getAliasSchema = {
    response: {
    200: {
        type: 'array',
        items : {
            type: 'object',
            properties: {
                id: { type: 'number'},
                alias: { type: 'string'}
            }
        }
        }
    }
};

export const anonymizeAccountSchema = {
  body: {
    type: 'object',
    properties: {}, // No body expected, but you can add fields if needed
    additionalProperties: false
  }
};

export const deleteAccountSchema = {
  body: {
    type: 'object',
    properties: {}, // No body expected, but you can add fields if needed
    additionalProperties: false
  }
};
