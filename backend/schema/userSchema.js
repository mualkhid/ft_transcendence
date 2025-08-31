const registerSchema = {
    body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
            username: { 
                type: 'string', 
                minLength: 3, 
                maxLength: 20,
                pattern: '^[a-zA-Z0-9_]+$'
            },
            email: { 
                type: 'string', 
                format: 'email',
                maxLength: 100
            },
            password: { 
                type: 'string', 
                minLength: 8,
                maxLength: 100
            }
        }
    },
    response: {
        201: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        avatar_url: { type: 'string' },
                        games_played: { type: 'number' },
                        wins: { type: 'number' },
                        losses: { type: 'number' },
                        created_at: { type: 'string' }
                    }
                }
            }
        }
    }
};

const loginSchema = {
    body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: { 
                type: 'string', 
                format: 'email'
            },
            password: { 
                type: 'string'
            }
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                token: { type: 'string' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        avatar_url: { type: 'string' },
                        games_played: { type: 'number' },
                        wins: { type: 'number' },
                        losses: { type: 'number' },
                        two_factor_enabled: { type: 'boolean' }
                    }
                }
            }
        }
    }
};

const updateProfileSchema = {
    body: {
        type: 'object',
        properties: {
            username: { 
                type: 'string', 
                minLength: 3, 
                maxLength: 20,
                pattern: '^[a-zA-Z0-9_]+$'
            },
            email: { 
                type: 'string', 
                format: 'email',
                maxLength: 100
            }
        },
        minProperties: 1
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: { type: 'string' }
            }
        }
    }
};

module.exports = { 
    registerSchema,
    loginSchema,
    updateProfileSchema
};