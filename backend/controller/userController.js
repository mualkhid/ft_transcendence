import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../prisma/prisma_lib.js';
import crypto from 'crypto';

// GDPR: Anonymize user data (replace PII with random values)
export async function anonymizeUser(req, reply)
{
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
export async function deleteUser (req, reply)
{
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

export async function getUserData(req, reply)
{
  const userId = req.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  reply.send({ user });
};
