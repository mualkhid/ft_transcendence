import { registerUser, deleteAccount, anonymizeAccount } from '../controller/userController.js';
import { registerSchema, deleteAccountSchema, anonymizeAccountSchema } from '../schema/userSchema.js';
import { authenticate } from '../services/jwtService.js';

export default function userRoutes(fastify, options) {
    // Removed conflicting /register route - using /auth/registerUser instead
    fastify.delete('/user/delete', { preHandler: authenticate, schema: deleteAccountSchema }, deleteAccount);
    fastify.post('/user/anonymize', { preHandler: authenticate, schema: anonymizeAccountSchema }, anonymizeAccount);
}