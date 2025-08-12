
// options for register
const registerUserOpts = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          reply: {type: 'string'}
        }
      }
    },
    body: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {type: 'string', minLength: 3, maxLength: 10},
        email: {type: 'string', format: 'email'},
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 64,
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[ !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]).{8,64}$'
        }
      }
    }
  },
}

module.exports = registerUserOpts