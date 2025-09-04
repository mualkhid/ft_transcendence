import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../prisma/prisma_lib.js';
import crypto from 'crypto';

export async function registerUser(request, reply){
    let {username, email, password} = request.body;

    // Sanitize user input
    username = sanitizeHtml(username);
    email = sanitizeHtml(email);

    if (!username || !email || !password) {
        return reply.status(400).send({ error: 'Username, email, and password are required' });
    }
    // Password strength check
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return reply.status(400).send({ error: "Password must be at least 8 characters, include a number and an uppercase letter." });
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return reply.status(409).send({ error: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return reply.status(409).send({ error: 'Email already exists' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash
            }
        });

        // Do not return passwordHash in response
        const { passwordHash: _, ...userWithoutHash } = user;
        return reply.status(201).send(userWithoutHash);
    } catch (err) {
        console.error("Registration error:", err);
        return reply.status(500).send({ error: "Internal server error." });
    }
};



export async function deleteAccount(req, reply) {
  const userId = req.user.id;
  try {
    // Delete user and all related data (e.g., friendships, tournaments, etc.)
    await prisma.user.delete({ where: { id: userId } });
    // Optionally: delete related data in other tables if needed
    return reply.status(200).send({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Account deletion error:", err);
    return reply.status(500).send({ error: "Internal server error." });
  }
}

export async function anonymizeAccount(req, reply) {
  const userId = req.user.id;
  try {
    // Replace username/email with random values
    const anonymizedUsername = 'user_' + crypto.randomBytes(6).toString('hex');
    const anonymizedEmail = anonymizedUsername + '@anonymized.local';
    await prisma.user.update({
      where: { id: userId },
      data: {
        username: anonymizedUsername,
        email: anonymizedEmail,
        // Optionally: clear other personal fields
      }
    });
    return reply.status(200).send({ message: "Account anonymized successfully." });
  } catch (err) {
    console.error("Account anonymization error:", err);
    return reply.status(500).send({ error: "Internal server error." });
  }
}
