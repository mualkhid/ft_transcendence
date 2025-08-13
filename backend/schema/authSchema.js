// user schema object
const userOpts = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  additionalProperties: false,
  required: ['id', 'username', 'email', 'createdAt', 'updatedAt']
};

export const registerUserOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: { type: 'string', minLength: 3, maxLength: 10 },
        email: { type: 'string', format: 'email' },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 64,
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[ !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]).{8,64}$'
        }
      },
      additionalProperties: false
    },
    response: {
      201: {
        type: 'object',
        properties: {
          user: userOpts
        },
        required: ['user']
      }
    }
  }
};

export const loginOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      additionalProperties: false,
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          user: userOpts
        },
        required: ['user']
      }
    }
  }
};

export const logoutOpts = {
  schema: {
    body: {
      type: 'object',
      additionalProperties: false
    },
    response: {
      204: {
        type: 'object',
        additionalProperties: false
      }
    }
  }
};

export const getCurrentUserOpts = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          user: userOpts
        },
        required: ['user']
      }
    }
  }
};
