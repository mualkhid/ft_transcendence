import { deleteUser, anonymizeUser, getUserData } from '../controller/userController.js';
import { registerSchema, deleteAccountSchema, anonymizeAccountSchema } from '../schema/userSchema.js';
import { authenticate } from '../services/jwtService.js';

export default function userRoutes(fastify, options) {
    // Removed conflicting /register route - using /auth/registerUser instead
    fastify.delete('/user/delete', {preHandler: authenticate}, deleteUser);
    fastify.post('/user/anonymize', {preHandler: authenticate}, anonymizeUser);
    fastify.get('/user/data', {preHandler: authenticate}, getUserData);
}
