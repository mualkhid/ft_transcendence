import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class TournamentController {
    // Create a new tournament
    async createTournament(request, reply) {
        try {
            const { name, maxPlayers, createdBy } = request.body;
            
            const tournament = await prisma.tournament.create({
                data: {
                    name,
                    maxPlayers,
                    createdBy,
                    status: 'ACTIVE'
                }
            });
            
            reply.code(201).send({
                success: true,
                tournament
            });
        } catch (error) {
            console.error('Error creating tournament:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to create tournament'
            });
        }
    }

    // Get all active tournaments
    async getActiveTournaments(request, reply) {
        try {
            const tournaments = await prisma.tournament.findMany({
                where: {
                    status: 'ACTIVE'
                },
                include: {
                    matches: {
                        include: {
                            player1: true,
                            player2: true,
                            winner: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            
            reply.send({
                success: true,
                tournaments
            });
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch tournaments'
            });
        }
    }

    // Join a tournament
    async joinTournament(request, reply) {
        try {
            const { tournamentId, playerName } = request.body;
            
            // Check if tournament exists and has space
            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: {
                    players: true
                }
            });
            
            if (!tournament) {
                return reply.code(404).send({
                    success: false,
                    error: 'Tournament not found'
                });
            }
            
            if (tournament.players.length >= tournament.maxPlayers) {
                return reply.code(400).send({
                    success: false,
                    error: 'Tournament is full'
                });
            }
            
            // Add player to tournament
            const player = await prisma.tournamentPlayer.create({
                data: {
                    name: playerName,
                    tournamentId: tournamentId
                }
            });
            
            reply.send({
                success: true,
                player
            });
        } catch (error) {
            console.error('Error joining tournament:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to join tournament'
            });
        }
    }

    // Generate tournament bracket
    async generateBracket(request, reply) {
        try {
            const { tournamentId } = request.params;
            
            const tournament = await prisma.tournament.findUnique({
                where: { id: parseInt(tournamentId) },
                include: {
                    players: true
                }
            });
            
            if (!tournament) {
                return reply.code(404).send({
                    success: false,
                    error: 'Tournament not found'
                });
            }
            
            const players = tournament.players;
            const matches = [];
            
            // Shuffle players for random seeding
            const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
            
            // Generate first round matches
            for (let i = 0; i < shuffledPlayers.length; i += 2) {
                if (i + 1 < shuffledPlayers.length) {
                    matches.push({
                        player1Id: shuffledPlayers[i].id,
                        player2Id: shuffledPlayers[i + 1].id,
                        round: 1,
                        tournamentId: tournamentId
                    });
                }
            }
            
            // Create matches in database
            const createdMatches = await prisma.tournamentMatch.createMany({
                data: matches
            });
            
            reply.send({
                success: true,
                matches: createdMatches
            });
        } catch (error) {
            console.error('Error generating bracket:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to generate bracket'
            });
        }
    }

    // Record match result
    async recordMatchResult(request, reply) {
        try {
            const { matchId, winnerId } = request.body;
            
            const match = await prisma.tournamentMatch.update({
                where: { id: matchId },
                data: {
                    winnerId: winnerId,
                    completed: true,
                    completedAt: new Date()
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true
                }
            });
            
            reply.send({
                success: true,
                match
            });
        } catch (error) {
            console.error('Error recording match result:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to record match result'
            });
        }
    }

    // Get tournament bracket
    async getTournamentBracket(request, reply) {
        try {
            const { tournamentId } = request.params;
            
            const matches = await prisma.tournamentMatch.findMany({
                where: {
                    tournamentId: parseInt(tournamentId)
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true
                },
                orderBy: [
                    { round: 'asc' },
                    { id: 'asc' }
                ]
            });
            
            // Group matches by round
            const bracket = {};
            matches.forEach(match => {
                if (!bracket[match.round]) {
                    bracket[match.round] = [];
                }
                bracket[match.round].push(match);
            });
            
            reply.send({
                success: true,
                bracket
            });
        } catch (error) {
            console.error('Error fetching bracket:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch bracket'
            });
        }
    }

    // Get next match
    async getNextMatch(request, reply) {
        try {
            const { tournamentId } = request.params;
            
            const nextMatch = await prisma.tournamentMatch.findFirst({
                where: {
                    tournamentId: parseInt(tournamentId),
                    completed: false
                },
                include: {
                    player1: true,
                    player2: true
                },
                orderBy: [
                    { round: 'asc' },
                    { id: 'asc' }
                ]
            });
            
            if (!nextMatch) {
                return reply.send({
                    success: true,
                    match: null,
                    message: 'Tournament complete'
                });
            }
            
            reply.send({
                success: true,
                match: nextMatch
            });
        } catch (error) {
            console.error('Error fetching next match:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch next match'
            });
        }
    }

    // Complete tournament
    async completeTournament(request, reply) {
        try {
            const { tournamentId } = request.params;
            
            const tournament = await prisma.tournament.update({
                where: { id: parseInt(tournamentId) },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });
            
            reply.send({
                success: true,
                tournament
            });
        } catch (error) {
            console.error('Error completing tournament:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to complete tournament'
            });
        }
    }
}

export default new TournamentController();
