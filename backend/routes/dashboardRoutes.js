import DashboardService from '../services/dashboardService.js';

/**
 * Dashboard Routes
 * 
 * Provides comprehensive game statistics and analytics endpoints:
 * - User dashboard overview
 * - Game-specific statistics
 * - Performance metrics
 * - Achievement tracking
 */

async function dashboardRoutes(fastify, options) {
    
    // Get general dashboard data (public access)
    fastify.get('/dashboard', async (request, reply) => {
        try {
            // Import prisma directly for simple queries
            const { prisma } = await import('../prisma/prisma_lib.js');
            
            // Get AI game statistics directly
            const totalAIGames = await prisma.match.count({
                where: {
                    player2Alias: 'AI',
                    status: 'FINISHED'
                }
            });

            const aiWins = await prisma.match.count({
                where: {
                    player2Alias: 'AI',
                    status: 'FINISHED',
                    winnerAlias: 'Player'
                }
            });

            const aiLosses = totalAIGames - aiWins;
            const aiWinRate = totalAIGames > 0 ? (aiWins / totalAIGames * 100).toFixed(1) : 0;

            // Get multiplayer game statistics (non-AI, non-tournament games)
            const multiplayerGames = await prisma.match.count({
                where: {
                    player2Alias: { not: 'AI' },
                    tournamentId: null,
                    status: 'FINISHED'
                }
            });

            const multiplayerWins = await prisma.match.count({
                where: {
                    player2Alias: { not: 'AI' },
                    tournamentId: null,
                    status: 'FINISHED',
                    winnerAlias: 'Player'
                }
            });

            const multiplayerLosses = multiplayerGames - multiplayerWins;
            const multiplayerWinRate = multiplayerGames > 0 ? (multiplayerWins / multiplayerGames * 100).toFixed(1) : 0;

            // Get tournament statistics
            const totalTournaments = await prisma.tournament.count();
            const currentTournament = await prisma.tournament.findFirst({
                where: { status: 'ACTIVE' },
                select: { id: true, name: true, status: true }
            });

            const tournamentGames = await prisma.match.count({
                where: {
                    tournamentId: { not: null },
                    status: 'FINISHED'
                }
            });

            const tournamentWins = await prisma.match.count({
                where: {
                    tournamentId: { not: null },
                    status: 'FINISHED',
                    winnerAlias: 'Player'
                }
            });

            const tournamentLosses = tournamentGames - tournamentWins;
            const tournamentWinRate = tournamentGames > 0 ? (tournamentWins / tournamentGames * 100).toFixed(1) : 0;

            // Get recent games ordered by when they were actually played
            const recentGames = await prisma.match.findMany({
                where: { status: 'FINISHED' },
                include: { players: true },
                orderBy: [
                    { startedAt: 'desc' },  // First priority: when game started
                    { createdAt: 'desc' },  // Second priority: when match was created
                    { finishedAt: 'desc' }  // Third priority: when game finished
                ],
                take: 5
            });

            const formattedRecentGames = recentGames.map(game => ({
                type: game.player2Alias === 'AI' ? 'AI Game' : 
                      game.tournamentId ? 'Tournament' : 'Multiplayer',
                opponent: game.player2Alias,
                result: game.winnerAlias === 'Player' ? 'WIN' : 'LOSS',
                score: `${game.players.find(p => p.alias === 'Player')?.score || 0}-${game.players.find(p => p.alias !== 'Player')?.score || 0}`,
                date: game.startedAt || game.createdAt || game.finishedAt,  // Use startedAt if available, fallback to createdAt, then finishedAt
                startedAt: game.startedAt,
                createdAt: game.createdAt,
                finishedAt: game.finishedAt
            }));

            // Calculate overall statistics
            const totalGames = totalAIGames + multiplayerGames + tournamentGames;
            const totalWins = aiWins + multiplayerWins + tournamentWins;
            const overallWinRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : 0;

            // Determine favorite game type
            let favoriteGameType = 'AI Games';
            if (multiplayerGames > totalAIGames && multiplayerGames > tournamentGames) {
                favoriteGameType = 'Multiplayer';
            } else if (tournamentGames > totalAIGames && tournamentGames > multiplayerGames) {
                favoriteGameType = 'Tournaments';
            }
            
            return reply.status(200).send({
                success: true,
                data: {
                    aiGameStats: {
                        totalGames: totalAIGames,
                        wins: aiWins,
                        losses: aiLosses,
                        winRate: parseFloat(aiWinRate),
                        averageScore: 3.5,
                        bestScore: 5
                    },
                    multiplayerStats: {
                        totalGames: multiplayerGames,
                        wins: multiplayerWins,
                        losses: multiplayerLosses,
                        winRate: parseFloat(multiplayerWinRate)
                    },
                    tournamentStats: {
                        totalTournaments: totalTournaments,
                        totalGames: tournamentGames,
                        wins: tournamentWins,
                        losses: tournamentLosses,
                        winRate: parseFloat(tournamentWinRate),
                        currentTournament: currentTournament
                    },
                    recentGames: formattedRecentGames,
                    summary: {
                        totalGames: totalGames,
                        totalWins: totalWins,
                        overallWinRate: parseFloat(overallWinRate),
                        favoriteGameType: favoriteGameType,
                        skillLevel: { level: 'Player', color: '#10b981', icon: '🎮' }
                    }
                }
            });
        } catch (error) {
            console.error('Dashboard route error:', error);
            return reply.status(500).send({ 
                success: false, 
                error: 'Failed to load dashboard data: ' + error.message
            });
        }
    });
}

export default dashboardRoutes;
