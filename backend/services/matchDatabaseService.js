import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createCasualMatch(player1Alias, player2Alias, customId = null)
{
    try {
        const match = await prisma.match.create({
            data: {
                tournamentId: null,
                roundNumber: 1,
                matchNumber: 1,
                status: 'PENDING',
                player1Alias,
                player2Alias,
                players: {
                    create: [
                        { alias: player1Alias },
                        { alias: player2Alias }
                    ]
                }
            }
        });

        if (customId !== null)
        {
            matchData.id = parseInt(customId);
        }

        const matchs = await prisma.match.create({
            data: matchData
        });
        return (matchs);
    }
    catch (error)
    {
        console.error('Failed to create casual match:', error);
        return null;
    }
}

export async function startMatch(matchId)
{
    try {
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'ONGOING',
                startedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Failed to start match:', error);
    }
}

export async function completeMatch(matchId, winnerAlias, player1Score, player2Score)
{
    try
    {
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'FINISHED',
                winnerAlias,
                finishedAt: new Date()
            }
        });

        await prisma.matchPlayer.updateMany({
            where: {
                matchId: matchId,
                alias: winnerAlias
            },
            data: {
                score: winnerAlias === (await prisma.match.findUnique({ where: { id: matchId } })).player1Alias ? player1Score : player2Score,
                result: 'WIN'
            }
        });

        await prisma.matchPlayer.updateMany({
            where: {
                matchId: matchId,
                alias: { not: winnerAlias }
            },
            data: {
                score: winnerAlias === (await prisma.match.findUnique({ where: { id: matchId } })).player1Alias ? player2Score : player1Score,
                result: 'LOSS'
            }
        });

        console.log(`Match ${matchId} completed. Winner: ${winnerAlias}`);
    }
    catch (error)
    {
        console.error('Failed to complete match:', error);
    }
}