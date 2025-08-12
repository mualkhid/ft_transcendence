const { users, generateUserId } = require('../services/userService');

async function registerUser(request, reply){
    const {alias} = request.body;

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
};

async function getAliases(request, reply)
{
    const aliasList = Array.from(users.values());
    return reply.send(aliasList);
}

module.exports= {
    registerUser,
    getAliases
};