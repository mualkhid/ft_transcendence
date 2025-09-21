import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../prisma/prisma_lib.js';
import crypto from 'crypto';

// GDPR: Anonymize user data
export async function anonymizeUser(req, reply) {
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.user.update({
      where: { id: userId },
      data: {
        originalUsername: user.originalUsername || user.username,
        originalEmail: user.originalEmail || user.email,
        username: `anon_${userId}_${Date.now()}`,
        email: `anon_${userId}_${Date.now()}@example.com`,
      }
    });
    reply.send({ message: 'Your data has been anonymized.' });
  } catch (err) {
    console.error("Account anonymization error:", err);
    return reply.status(500).send({ error: "Internal server error." });
  }
}

export async function unAnonymizeUser(req, reply) {
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.originalUsername?.trim() || !user.originalEmail?.trim()) {
      return reply.status(400).send({ error: "No original data to restore." });
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        username: user.originalUsername,
        email: user.originalEmail,
        originalUsername: null,
        originalEmail: null,
      }
    });
    reply.send({ message: 'Your account has been restored.' });
  } catch (err) {
    console.error("Account restoration error:", err);
    return reply.status(500).send({ error: "Internal server error." });
  }
}

export async function deleteUser(req, reply) {
    const userId = req.user.id;
    try {        
        await prisma.user.delete({ where: { id: userId } });
        reply.send({ message: 'Your account and all data have been deleted.' });
    } catch (err) {
        console.error("Account deletion error:", err);
        return reply.status(500).send({ error: "Internal server error." });
    }
};

export async function getUserData(req, reply) {
    const userId = req.user.id; 
    try {
        const userData = await prisma.user.findUnique({ 
            where: { id: userId }
        });
        
        if (!userData) {
            return reply.status(404).send({ error: "User not found." });
        }
        
        // Remove sensitive data
        const sanitizedData = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            lastSeen: userData.lastSeen,
            gamesPlayed: userData.gamesPlayed,
            wins: userData.wins,
            losses: userData.losses,
            isTwoFactorEnabled: userData.isTwoFactorEnabled,
            avatarUrl: userData.avatarUrl
        };
        
        reply.send({ 
            exportDate: new Date().toISOString(),
            userData: sanitizedData 
        });
    } catch (err) {
        console.error("Data export error:", err);
        return reply.status(500).send({ error: "Internal server error." });
    }
}

