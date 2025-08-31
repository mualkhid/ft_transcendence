import { ValidationError, AuthenticationError, AuthorizationError} from '../utils/errors.js';

function handlePrismaErrors(e, reply) {

	
	const parts = e.message.split('\n\n\n');
  	const clean = parts[parts.length - 1].trim();

	if (e.code === "P2001"|| e.code === "P2015" || e.code === "P2018" || e.code === "P2025")
		return reply.status(404).send({error:clean})
 
	if (e.code === "P2002" || e.code === "P2003" || e.code === "P2014" || e.code === "P2034")
		return reply.status(409).send({error:clean})
	
	if (e.code === "P2000" || e.code === "P2004" || e.code === "P2005" || e.code === "P2006" 
		|| e.code === "P2007" || e.code === "P2008" || e.code === "P2009"
		|| e.code === "P2010" || e.code === "P2011" || e.code === "P2012" || e.code === "P2013"
		|| e.code === "P2016" || e.code === "P2017" || e.code === "P2019"
		|| e.code === "P2020" || e.code === "P2026" || e.code === "P2027"
		|| e.code === "P2033")
		return reply.status(400).send({error:clean})
 
	if (e.code === "P2024" || e.code === "P2030" || e.code === "P2031")
		return reply.status(503).send({error:clean})
 
	if (e.code === "P2021" || e.code === "P2022" || e.code === "P2023" || e.code === "P2028")
		return reply.status(500).send({error:clean})
 
	// Default for any other P-codes not covered
	return reply.status(500).send({error: "Database error occurred"})
}

function handleGeneralErrors(e, reply) {
	
	// Custom application errors
	if (e.code === 'FST_ERR_VALIDATION' || e instanceof ValidationError) {
		return reply.status(400).send({ error: e.message });
	}
	
	if (e instanceof AuthenticationError) {
		return reply.status(401).send({ error: e.message });
	}
	
	if (e instanceof AuthorizationError) {
		return reply.status(403).send({ error: e.message });
	}
	
	// Built-in JavaScript errors
	if (e instanceof TypeError) {
		return reply.status(400).send({ error: 'Invalid data type provided' });
	}
	
	if (e instanceof SyntaxError || e.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
		return reply.status(400).send({ error: 'Invalid JSON format' });
	}
	
	if (e instanceof ReferenceError) {
		console.error('ReferenceError:', e.message);
		return reply.status(500).send({ error: 'Internal server error' });
	}

	// Generic fallback for unknown errors
	console.error('Unknown error:', e);
	return reply.status(500).send({ error: e.message });
}

export function globalErrorHandler(error, request, reply) {
	console.log('Global error caught:', error);
	
	// Prisma errors
	if (error.code?.startsWith('P')) {
		return handlePrismaErrors(error, reply);
	}
	
	// All other errors
	return handleGeneralErrors(error, reply);
}