import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createTournament(request, reply)
{
    const { name, players, maxPlayers = 4 } = request.body;
    const userId = request.user?.id;

    if (!name || !players || !Array.isArray(players)) {
        return reply.status(400).send({ 
            error: 'Tournament name and players array are required' 
        });
    }

    if (players.length !== 4) {
        return reply.status(400).send({ 
            error: 'Tournament must have exactly 4 players' 
        });
    }

    const tournament = await prisma.tournament.create({
        data: {
            name,
            maxPlayers,
            createdBy: userId,
            status: 'ACTIVE'
        }
    });

    const tournamentPlayers = await Promise.all(
        players.map(async (playerName) => {
            const existingUser = await prisma.user.findFirst({
                where: { username: playerName }
            });

            return prisma.tournamentPlayer.create({
                data: {
                    tournamentId: tournament.id,
                    name: playerName,
                    userId: existingUser?.id || null
                }
            });
        })
    );

    const response = {
        success: true,
        message: 'Tournament created successfully',
        tournamentId: tournament.id,
        tournament: {
            id: tournament.id,
            name: tournament.name,
            maxPlayers: tournament.maxPlayers,
            players: tournamentPlayers.map(p => p.name)
        }
    };

    return reply.status(201).send(response);
}

export async function recordLocalTournamentResult(request, reply)
{
    const { winner, loser, tournamentName = 'Local Tournament', tournamentId, round = 1 } = request.body;

    if (!winner || !loser)
        return reply.status(400).send({ error: 'Winner and loser are required' });

    if (!tournamentId)
        return reply.status(400).send({ error: 'Tournament ID is required' });

    const updates = [];
    const [winnerUser, loserUser] = await Promise.all([
        prisma.user.findFirst({ where: { username: winner } }),
        prisma.user.findFirst({ where: { username: loser } })
    ]);

    if (winnerUser) {
        updates.push(
            prisma.user.update({
                where: { id: winnerUser.id },
                data: { 
                    wins: { increment: 1 },
                    gamesPlayed: { increment: 1 }
                }
            })
        );
    }

    if (loserUser) {
        updates.push(
            prisma.user.update({
                where: { id: loserUser.id },
                data: { 
                    losses: { increment: 1 },
                    gamesPlayed: { increment: 1 }
                }
            })
        );
    }
    
    const tournament = await prisma.tournament.findUnique({
        where: { id: parseInt(tournamentId) }
    });
    
    if (!tournament)
        return reply.status(404).send({ error: 'Tournament not found' });

    let winnerPlayer = await prisma.tournamentPlayer.findFirst({
        where: { 
            tournamentId: parseInt(tournamentId),
            name: winner 
        }
    });
    
    let loserPlayer = await prisma.tournamentPlayer.findFirst({
        where: { 
            tournamentId: parseInt(tournamentId),
            name: loser 
        }
    });

    if (!winnerPlayer || !loserPlayer) {
        if (!winnerPlayer) {
            winnerPlayer = await prisma.tournamentPlayer.findFirst({
                where: { 
                    tournamentId: parseInt(tournamentId),
                    name: winner.trim()
                }
            });
        }
        
        if (!loserPlayer) {
            loserPlayer = await prisma.tournamentPlayer.findFirst({
                where: { 
                    tournamentId: parseInt(tournamentId),
                    name: loser.trim()
                }
            });
        }
    }

    if (winnerPlayer && loserPlayer) {
        const matchData = {
            tournamentId: parseInt(tournamentId),
            round: round,
            player1Id: winnerPlayer.id,
            player2Id: loserPlayer.id,
            winnerId: winnerPlayer.id,
            completed: true,
            completedAt: new Date()
        };
        
        updates.push(
            prisma.tournamentMatch.create({
                data: matchData
            })
        );
    }

    if (updates.length > 0) {
        await prisma.$transaction(updates);
    }

    return reply.status(200).send({
        success: true,
        message: `Tournament result recorded: ${winner} beats ${loser}`,
        statsUpdated: updates.length > 0,
        updatesCount: updates.length,
        tournamentMatchCreated: !!(winnerPlayer && loserPlayer)
    });
}

export async function getTournament(request, reply)
{
    const { id } = request.params;

    const tournament = await prisma.tournament.findUnique({
        where: { id: parseInt(id) },
        include: {
            players: {
                include: {
                    user: {
                        select: { id: true, username: true }
                    }
                }
            },
            matches: {
                include: {
                    player1: true,
                    player2: true,
                    winner: true
                }
            },
            creator: {
                select: { id: true, username: true }
            }
        }
    });

    if (!tournament)
        return reply.status(404).send({ error: 'Tournament not found' });

    return reply.status(200).send({
        success: true,
        tournament
    });
}

export async function completeTournament(request, reply)
{
    const { id } = request.params;
    const { winnerId } = request.body;

    const tournament = await prisma.tournament.update({
        where: { id: parseInt(id) },
        data: {
            status: 'COMPLETED',
            completedAt: new Date()
        },
        include: {
            players: true,
            matches: true
        }
    });

    return reply.status(200).send({
        success: true,
        message: 'Tournament completed',
        tournament
    });
}