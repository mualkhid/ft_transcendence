import { registerUser, deleteAccount, anonymizeUser, getUserData } from '../controller/userController.js';
import { registerSchema, deleteAccountSchema, anonymizeAccountSchema } from '../schema/userSchema.js';
import { authenticate } from '../services/jwtService.js';

export default function userRoutes(fastify, options) {
    // Removed conflicting /register route - using /auth/registerUser instead
    fastify.delete('/user/delete', { preValidation: [fastify.authenticate] }, deleteAccount);
    fastify.post('/user/anonymize', { preValidation: [fastify.authenticate] }, anonymizeUser);
    fastify.get('/user/data', { preValidation: [fastify.authenticate] }, getUserData);
}
