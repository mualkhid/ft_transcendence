const {
    users,
    generateUserId
} = require('../services/userService');

async function userRoutes(fastify, options)
{
    fastify.post('/register', async (request, reply) => {
        const { alias } = request.body;
    if(!alias || alias.length < 3 || alias.length > 20)
        return reply.status(400).send({ error: 'Invalid alias'});

    for(const user of users.values()){
        if(user.alias === alias)
            return reply.status(409).send({ error: 'Alias already exists'});
    }
    const user = {
        id: generateUserId(),
        alias
    };

    users.set(user.id, user);

    return reply.status(201).send(user);
    });
    fastify.get('/aliases', async(request, reply) => {
        const aliasList = Array.from(users.values());
        return reply.send(aliasList);
    });
}

module.exports = userRoutes;