export class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ValidationError';
	}
}

export class AuthenticationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

export class AuthorizationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'AuthorizationError';
	}
}

export class notFoundError extends Error {
	constructor (message) {
		super(message);
		this.name = "NotFoundError"
	}
}