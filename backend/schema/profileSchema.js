// user schema object
export const userOpts = {
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

  export const updatePasswordOpts = {
	schema: {
		body: {
			type: 'object',
			properties: {
				currentPassword: { type: 'string', minLength: 1},
				newPassword: { 
					type: 'string',
					minLength: 8,
					maxLength: 64,
					pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[ !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]).{8,64}$'
				}
			},
			required: ['currentPassword', 'newPassword'],
			additionalProperties: false
		},
		response: {
			200: {

				type: 'object',
				properties: {
					message: {
					type: 'string'
					}
				}
			}
		}
	}
}


export const updateUsernameOpts = {
	schema: {
		body: {
			type: 'object',
			properties: {
				newUsername: { type: 'string', minLength: 3, maxLength: 10 }
			},
			required: ['newUsername'],
			additionalProperties: false
		},
		response: {
			200: {

				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		}
	}
}

export const updateAvatarOpts = {
	schema: {
	  summary: 'Upload or update user avatar',
	  description: 'Uploads a new avatar image for the current user (JPEG/PNG/WebP).',
	  consumes: ['multipart/form-data'],   // lets Swagger know it's file upload
	  tags: ['Profile'],
	  body: {
		type: 'object',
		properties: {
		  avatar: {
			type: 'string',
			format: 'binary'   // 👈 this is the key that makes Swagger show a file input
		  }
		},
		required: ['avatar']
	},
	  response: {
		200: {
		  type: 'object',
		  properties: {
			avatarUrl: { type: 'string', format: 'uri' }
		  },
		  required: ['avatarUrl'],
		  additionalProperties: false
		},
		400: {
		  type: 'object',
		  properties: {
			error: { type: 'string' }
		  },
		  required: ['error']
		},
		413: {
		  type: 'object',
		  properties: {
			error: { type: 'string' }
		  },
		  required: ['error']
		},
		415: {
		  type: 'object',
		  properties: {
			error: { type: 'string' }
		  },
		  required: ['error']
		}
	  }
	}
  };
  