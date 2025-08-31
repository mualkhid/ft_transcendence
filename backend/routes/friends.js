const { 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getFriendRequests, 
    getFriendsList, 
    removeFriend, 
    searchUsersForFriends 
} = require('../controller/friendsController');

async function friendsRoutes(fastify, options) {
    // All friends routes require authentication
    fastify.post('/friends/request', { 
        preHandler: fastify.authenticate 
    }, sendFriendRequest);
    
    fastify.post('/friends/:friendId/accept', { 
        preHandler: fastify.authenticate 
    }, acceptFriendRequest);
    
    fastify.post('/friends/:friendId/reject', { 
        preHandler: fastify.authenticate 
    }, rejectFriendRequest);
    
    fastify.get('/friends/requests', { 
        preHandler: fastify.authenticate 
    }, getFriendRequests);
    
    fastify.get('/friends', { 
        preHandler: fastify.authenticate 
    }, getFriendsList);
    
    fastify.delete('/friends/:friendId', { 
        preHandler: fastify.authenticate 
    }, removeFriend);
    
    fastify.get('/friends/search', { 
        preHandler: fastify.authenticate 
    }, searchUsersForFriends);
}

module.exports = friendsRoutes;
