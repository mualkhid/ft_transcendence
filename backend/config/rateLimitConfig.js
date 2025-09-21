// config/rateLimitConfigs.js
// Clean rate limiting configurations

const generateKeyFromRequest = (request, prefix) => {
	const email = request.body?.email?.toLowerCase()?.trim();
	if (email) {
	  console.log(`🔑 Rate limit key: ${prefix}:${email}`);
	  return `${prefix}:${email}`;
	}
	
	const cid = request.headers['x-client-id'] || request.cookies?.client_id;
	if (cid) {
	  console.log(`🔑 Rate limit key: ${prefix}cid:${cid}`);
	  return `${prefix}cid:${cid}`;
	}
	
	const xff = request.headers['x-forwarded-for'];
	const ip = Array.isArray(xff) ? xff[0] : (xff ? xff.split(',')[0].trim() : request.ip);
	console.log(`🔑 Rate limit key: ${prefix}ip:${ip}`);
	return `${prefix}ip:${ip}`;
  };
  
  const createErrorResponse = (message, context) => {
	console.log(`🚨 ${message} rate limit exceeded`);
	return {
	  statusCode: 429,
	  error: 'Too Many Requests',
	  message: `Too many ${message.toLowerCase()} attempts. Please try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
	  retryAfter: Math.ceil(context.ttl / 1000)
	};
  };
  
  export const loginRateLimit = {
	max: 10,
	timeWindow: '10 minutes',
	keyGenerator: (request) => generateKeyFromRequest(request, 'login'),
	errorResponseBuilder: (request, context) => createErrorResponse('Login', context),
	onExceeding: (request, key) => {
	  console.log(`⚠️  Login rate limit exceeded for key: ${key}`);
	}
  };
  
  export const registerRateLimit = {
	max: 3,
	timeWindow: '1 hour',
	keyGenerator: (request) => generateKeyFromRequest(request, 'register'),
	errorResponseBuilder: (request, context) => createErrorResponse('Registration', context)
  };
  
  // Helper function to merge rate limit config with existing route options
  export const withRateLimit = (routeOpts, rateLimitConfig) => ({
	...routeOpts,
	config: {
	  ...routeOpts.config,
	  rateLimit: rateLimitConfig
	}
  });