
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
      required: ['name'],
      properties: {
        name: {type: 'string'}
      }
    }
  },
}

module.exports = registerUserOpts