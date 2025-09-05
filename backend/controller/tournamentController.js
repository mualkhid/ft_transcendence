import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createTournament(request, reply) {
    console.log('=== createTournament CALLED ===');
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    console.log('Body:', request.body);
    console.log('User:', request.user);

    const { name, players, maxPlayers = 4 } = request.body;
    const userId = request.user?.id;

    console.log('Extracted values:', { name, players, maxPlayers, userId });

    if (!name || !players || !Array.isArray(players)) {
        console.log('Validation failed: missing name or players');
        return reply.status(400).send({ 
            error: 'Tournament name and players array are required' 
        });
    }

    if (players.length !== 4) {
        console.log('Validation failed: wrong number of players');
        return reply.status(400).send({ 
            error: 'Tournament must have exactly 4 players' 
        });
    }

    try {
        console.log('Creating tournament in database...');
        // Create tournament record
        const tournament = await prisma.tournament.create({
            data: {
                name,
                maxPlayers,
                createdBy: userId,
                status: 'ACTIVE'
            }
        });

        console.log('Tournament created:', tournament);

        console.log('Creating tournament players...');
        // Create tournament players
        const tournamentPlayers = await Promise.all(
            players.map(async (playerName, index) => {
                console.log(`Processing player ${index + 1}: ${playerName}`);
                // Try to find existing user
                const existingUser = await prisma.user.findFirst({
                    where: { username: playerName }
                });

                console.log(`Player ${playerName} found in users:`, !!existingUser);

                return prisma.tournamentPlayer.create({
                    data: {
                        tournamentId: tournament.id,
                        name: playerName,
                        userId: existingUser?.id || null
                    }
                });
            })
        );

        console.log('Tournament players created:', tournamentPlayers.length);

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

        console.log('Sending response:', response);

        return reply.status(201).send(response);

    } catch (error) {
        console.error('Error in createTournament:', error);
        return reply.status(500).send({
            error: 'Internal server error',
            details: error.message
        });
    }
}

export async function recordLocalTournamentResult(request, reply)
{
    const { winner, loser, tournamentName = 'Local Tournament', tournamentId, round = 1 } = request.body;

    console.log('=== RECORDING TOURNAMENT RESULT ===');
    console.log('Data received:', { winner, loser, tournamentId, round });

    if (!winner || !loser) {
        return reply.status(400).send({ error: 'Winner and loser are required' });
    }

    try {
        const updates = [];

        // Find users and update their stats
        const [winnerUser, loserUser] = await Promise.all([
            prisma.user.findFirst({ where: { username: winner } }),
            prisma.user.findFirst({ where: { username: loser } })
        ]);

        console.log('Found users:', { winner: !!winnerUser, loser: !!loserUser });

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

        // Record tournament match if tournamentId provided
        if (tournamentId) {
            const [winnerPlayer, loserPlayer] = await Promise.all([
                prisma.tournamentPlayer.findFirst({
                    where: { 
                        tournamentId: parseInt(tournamentId),
                        name: winner 
                    }
                }),
                prisma.tournamentPlayer.findFirst({
                    where: { 
                        tournamentId: parseInt(tournamentId),
                        name: loser 
                    }
                })
            ]);

            console.log('Found tournament players:', { winner: !!winnerPlayer, loser: !!loserPlayer });

            if (winnerPlayer && loserPlayer) {
                updates.push(
                    prisma.tournamentMatch.create({
                        data: {
                            tournamentId: parseInt(tournamentId),
                            round: round,
                            player1Id: winnerPlayer.id,
                            player2Id: loserPlayer.id,
                            winnerId: winnerPlayer.id,
                            completed: true,
                            completedAt: new Date()
                        }
                    })
                );
                console.log(`Tournament match record created for tournament ${tournamentId}, round ${round}`);
            }
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
            console.log(`Executed ${updates.length} database updates`);
        }

        return reply.status(200).send({
            success: true,
            message: `Tournament result recorded: ${winner} beats ${loser}`,
            statsUpdated: updates.length > 0,
            updatesCount: updates.length
        });
    } catch (error) {
        console.error('Error in recordLocalTournamentResult:', error);
        return reply.status(500).send({ 
            error: 'Internal server error recording tournament result',
            details: error.message 
        });
    }
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

        if (!tournament) {
            return reply.status(404).send({ error: 'Tournament not found' });
        }

        return reply.status(200).send({
            success: true,
            tournament
        });
}

// Complete tournament
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

    console.log(`Tournament completed: ${tournament.name} (ID: ${tournament.id})`);

    return reply.status(200).send({
        success: true,
        message: 'Tournament completed',
        tournament
    });
}