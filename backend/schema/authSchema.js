// user schema object
export const userOpts = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    username: { type: 'string', minLength: 3, maxLength: 10, pattern: '^[a-zA-Z0-9_]+$' },
    email: { type: 'string', format: 'email'},
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
  additionalProperties: false
};

// fix error message for password + username pattern (regex)
export const registerUserOpts = {
  schema: {
    body: {
      type: 'object',
      properties: {
        username: { type: 'string', minLength: 3, maxLength: 10 },
        email: { type: 'string', format: 'email' },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 64,
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,64}$'
        }
      },
      required: ['username', 'email', 'password'],
      additionalProperties: false
    },
  }
};

export const loginOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      // additionalProperties: false,
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    },
  }
};

export const logoutOpts = {
  schema: {
    body: {
      type: 'object',
      additionalProperties: false
    },
  }
};
