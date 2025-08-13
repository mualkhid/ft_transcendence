import { registerUser, getAliases } from '../controller/userController.js';
import { registerSchema, getAliasSchema } from '../schema/userSchema.js';

async function userRoutes(fastify, options)
{
    fastify.post('/register', {schema : registerSchema}, registerUser);
    fastify.get('/aliases', { schema : getAliasSchema }, getAliases);
}

export default userRoutes;