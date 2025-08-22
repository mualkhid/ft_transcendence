import { userOpts } from "./authSchema.js";

const manyUsersOpts = {
	type: 'array',
	items: userOpts
}

export const getFriendsOpts = {
	schema: {
		response: {
			200: {
				type: 'object',
				properties: {
					users: manyUsersOpts
				}
			}
		}
	}
}

export const requestOpts = {
	schema: {
		body: {
			type: 'object',
			properties: {
				userId: {type: 'integer'}
			},
			additionalProperties: false
		},
		response: {
			200: {  // ✅ Added status code for clarity
				type: 'object',
				properties: {message: {type: 'string'}}
			}
		}
	}
}