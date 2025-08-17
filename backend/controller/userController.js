const bcrypt = require('bcrypt');
const userService = require('../services/userService');

async function registerUser(req, reply) {
  try {
    const { username, email, password } = req.body;

    // Check for missing fields
    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'Username, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return reply.status(409).send({ error: 'Email already registered.' });
    }

    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (hashErr) {
      console.error('Hashing error:', hashErr);
      return reply.status(500).send({ error: 'Failed to process password.' });
    }

    // Save user with hashed password
    try {
      await userService.createUser({ username, email, password: hashedPassword });
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      return reply.status(500).send({ error: 'Failed to save user.' });
    }

    reply.status(201).send({ message: 'User registered!' });
  } catch (err) {
    // Catch-all for unexpected errors
    console.error('Unexpected error:', err);
    reply.status(500).send({ error: 'Internal server error.' });
  }
}

async function getAliases(request, reply)
{
    const aliasList = Array.from(users.values());
    return reply.send(aliasList);
}

async function loginUser(req, reply) {
  try {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required.' });
    }

    // Find user by email
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password.' });
    }

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Invalid email or password.' });
    }

    // Authentication successful (you can generate a JWT here if needed)
    reply.status(200).send({ message: 'Login successful!' });
  } catch (err) {
    console.error('Login error:', err);
    reply.status(500).send({ error: 'Internal server error.' });
  }
}

module.exports = {
  registerUser,
  getAliases,
  loginUser
};



// const { users, generateUserId } = require('../services/userService');

// async function registerUser(request, reply){
//     const {alias} = request.body;

//     for(const user of users.values()){
//         if(user.alias === alias)
//             return reply.status(409).send({ error: 'Alias already exists'});
//     }
//     const user = {
//         id: generateUserId(),
//         alias
//     };

//     users.set(user.id, user);
//     return reply.status(201).send(user);
// };

// async function getAliases(request, reply)
// {
//     const aliasList = Array.from(users.values());
//     return reply.send(aliasList);
// }

// module.exports= {
//     registerUser,
//     getAliases
// };