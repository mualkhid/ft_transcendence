const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile, 
    uploadAvatar,
    updateGameStats,
    getAllUsers, 
    searchUsers 
} = require('../controller/userController');

const { 
    registerSchema, 
    loginSchema, 
    updateProfileSchema 
} = require('../schema/userSchema');

async function userRoutes(fastify, options) {
    // Public routes (no authentication required)
    fastify.post('/register', { schema: registerSchema }, registerUser);
    fastify.post('/login', { schema: loginSchema }, loginUser);
    
    // Protected routes (authentication required)
    fastify.get('/profile', { preHandler: fastify.authenticate }, getUserProfile);
    fastify.put('/profile', { 
        schema: updateProfileSchema, 
        preHandler: fastify.authenticate 
    }, updateUserProfile);
    fastify.post('/profile/avatar', { preHandler: fastify.authenticate }, uploadAvatar);
    fastify.post('/profile/stats', { preHandler: fastify.authenticate }, updateGameStats);
    
    fastify.get('/users', { preHandler: fastify.authenticate }, getAllUsers);
    fastify.get('/users/search', { preHandler: fastify.authenticate }, searchUsers);
}

module.exports = userRoutes;