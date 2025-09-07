import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createMatch(player1Alias, player2Alias, customId = null)
{
    const matchData = {
        tournamentId: null,
        roundNumber: 1,
        matchNumber: 1,
        status: 'PENDING',
        player1Alias,
        player2Alias,
    };

    const match = await prisma.match.create({
        data: matchData,
    });

    await prisma.matchPlayer.createMany({
        data: [
            { matchId: match.id, alias: player1Alias},
            { matchId: match.id, alias: player2Alias}
        ]
    });

    return (match);
}

export async function startMatch(matchId)
{
    const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
            status: 'ONGOING',
            startedAt: new Date()
        }
    });
    
    return updatedMatch;
}

export async function completeMatch(matchId, winnerAlias, player1Score, player2Score)
{
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { players: true }
    });

    if (!match)
        throw new Error(`Match ${matchId} not found`);

    await prisma.match.update({
        where: { id: matchId },
        data: {
            status: 'FINISHED',
            winnerAlias,
            finishedAt: new Date()
        }
    });
    const winnerScore = winnerAlias === match.player1Alias ? player1Score : player2Score;
    await prisma.matchPlayer.updateMany({
        where: {
            matchId: matchId,
            alias: winnerAlias
        },
        data: {
            score: winnerScore,
            result: 'WIN'
        }
    });

    const loserScore = winnerAlias === match.player1Alias ? player2Score : player1Score;
    await prisma.matchPlayer.updateMany({
        where: {
            matchId: matchId,
            alias: { not: winnerAlias }
        },
        data: {
            score: loserScore,
            result: 'LOSS'
        }
    });
}