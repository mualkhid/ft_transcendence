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





// GDPR: Anonymize user data (replace PII with random values)
exports.anonymizeUser = async (req, reply) => {
  const userId = req.user.id;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        username: `anon_${userId}_${Date.now()}`,
        email: `anon_${userId}_${Date.now()}@example.com`,
        // ...anonymize other fields as needed
      }
    });
    // Optionally anonymize related data (friends, messages, etc.)
    reply.send({ message: 'Your data has been anonymized.' });
  } catch (err) {
    console.error("Account anonymization error:", err);
    return reply.status(500).send({ error: "Internal server error." });
  }
};


// GDPR: Delete user and cascade delete related data
exports.deleteUser = async (req, reply) => {
  const userId = req.user.id;
  try {
    // Cascade delete related data (example: friends, tournaments, etc.)
    await prisma.friend?.deleteMany?.({ where: { OR: [{ userId }, { friendId: userId }] } });
    await prisma.tournament?.deleteMany?.({ where: { creatorId: userId } });
    // Add more related deletions as needed
    await prisma.user.delete({ where: { id: userId } });
    reply.send({ message: 'Your account and all data have been deleted.' });
  } catch (err) {
    console.error("Account deletion error:", err);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

exports.getUserData = async (req, reply) => {
  const userId = req.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  reply.send({ user });
};
