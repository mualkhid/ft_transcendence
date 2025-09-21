import { deleteUser, anonymizeUser, getUserData, unAnonymizeUser } from '../controller/userController.js';
import { registerSchema, deleteAccountSchema, anonymizeAccountSchema } from '../schema/userSchema.js';
import { authenticate } from '../services/jwtService.js';

export default function userRoutes(fastify, _opts, done) {
    // Removed conflicting /register route - using /auth/registerUser instead
    fastify.delete('/user/delete', {preHandler: authenticate}, deleteUser);
    fastify.post('/user/anonymize', {preHandler: authenticate}, anonymizeUser);
    fastify.get('/user/data', {preHandler: authenticate}, getUserData);
    fastify.post('/user/unanonymize', {preHandler: authenticate }, unAnonymizeUser);
    done();
}
