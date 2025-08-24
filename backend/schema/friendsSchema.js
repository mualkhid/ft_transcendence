
export const requestOpts = {
	schema: {
		body: {
			type: 'object',
			properties: {
				userId: {type: 'integer'}
			},
			additionalProperties: false
		},
	}
}