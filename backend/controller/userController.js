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
      }
    });
    // Optionally anonymize related data (friends, messages, etc.)
    reply.send({ message: 'Your data has been anonymized.' });
  } catch (err) {
    console.error("Account anonymization error:", err);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

export async function deleteUser(req, reply) {
    const userId = req.user.id;
    try {
        // Delete in proper order to avoid foreign key constraints
        
        // Delete friendships
        // await prisma.friendship.deleteMany({ 
        //     where: { 
        //         OR: [
        //             { requesterId: userId }, 
        //             { addresseeId: userId }
        //         ] 
        //     } 
        // });
        
        // // Delete game history
        // await prisma.gameHistory.deleteMany({ 
        //     where: { 
        //         OR: [
        //             { player1Id: userId }, 
        //             { player2Id: userId }
        //         ] 
        //     } 
        // });
        
        // // Delete tournaments created by this user
        // await prisma.tournament.deleteMany({ 
        //     where: { creatorId: userId } 
        // });
        
        // // Delete any additional related data
        // await prisma.matchPlayer?.deleteMany?.({ 
        //     where: { userId: userId }
        // });
        
        // await prisma.tournamentPlayer?.deleteMany?.({ 
        //     where: { userId: userId }
        // });
        
        // Finally delete the user
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

