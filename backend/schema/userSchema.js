const registerSchema = {
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

const getAliasSchema = {
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
}

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    }
  }
};

module.exports = { 
    registerSchema,
    getAliasSchema,
    loginSchema
};