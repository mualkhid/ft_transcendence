import DashboardService from '../services/dashboardService.js';
import { authenticate } from '../services/jwtService.js';

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
    
    // Get user-specific dashboard data (authenticated)
    fastify.get('/dashboard/user', { 
        preHandler: [authenticate] 
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            console.log('Getting user dashboard for userId:', userId);
            const dashboardData = await DashboardService.getUserDashboard(userId);
            console.log('Dashboard data retrieved successfully');
            return reply.send(dashboardData);
        } catch (error) {
            console.error('Error getting user dashboard:', error);
            console.error('Error stack:', error.stack);
            return reply.status(500).send({ error: 'Failed to load dashboard data: ' + error.message });
        }
    });

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
                    OR: [
                        { winnerAlias: 'Player' },  // Old format
                        { winnerAlias: { not: 'AI' } }  // New format (any non-AI winner)
                    ]
                }
            });

            const aiLosses = totalAIGames - aiWins;
            const aiWinRate = totalAIGames > 0 ? (aiWins / totalAIGames * 100).toFixed(1) : 0;

            // Get Local game statistics (1 vs 1 on same device)
            const totalLocalGames = await prisma.match.count({
                where: {
                    player2Alias: 'Local Player',
                    status: 'FINISHED'
                }
            });

            // For local games, we need to count where the winner is NOT 'Local Player'
            // since the winner is either the user (player1Alias) or 'Local Player' (player2Alias)
            const localWins = await prisma.match.count({
                where: {
                    player2Alias: 'Local Player',
                    status: 'FINISHED',
                    winnerAlias: { not: 'Local Player' }
                }
            });

            const localLosses = totalLocalGames - localWins;
            const localWinRate = totalLocalGames > 0 ? (localWins / totalLocalGames * 100).toFixed(1) : 0;

            // Get multiplayer game statistics (non-AI, non-local games)
            const multiplayerGames = await prisma.match.count({
                where: {
                    player2Alias: { 
                        not: { in: ['AI', 'Local Player'] }
                    },
                    status: 'FINISHED'
                }
            });

            const multiplayerWins = await prisma.match.count({
                where: {
                    player2Alias: { 
                        not: { in: ['AI', 'Local Player'] }
                    },
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

            const formattedRecentGames = recentGames.map(game => {
                // Determine if the player won based on the winner alias
                // For AI games: winnerAlias is the username or 'AI' (or 'Player' for old format)
                // For local games: winnerAlias is the username or 'Local Player'
                const isPlayerWin = game.player2Alias === 'AI' ? 
                    (game.winnerAlias !== 'AI') : 
                    game.winnerAlias !== 'Local Player';
                
                // Get scores from match players
                const playerScore = game.players.find(p => p.alias === game.player1Alias)?.score || 0;
                const opponentScore = game.players.find(p => p.alias === game.player2Alias)?.score || 0;
                
                // Calculate game duration (avoid N/A by using robust fallbacks)
                const startCandidate = game.startedAt || game.createdAt;
                const endCandidate = game.finishedAt || game.startedAt || game.createdAt;
                let duration = '0:00';
                if (startCandidate && endCandidate) {
                    const startMs = new Date(startCandidate).getTime();
                    const endMs = new Date(endCandidate).getTime();
                    const durationMs = Math.max(0, endMs - startMs);
                    const minutes = Math.floor(durationMs / 60000);
                    const seconds = Math.floor((durationMs % 60000) / 1000);
                    duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }

                return {
                    type: game.player2Alias === 'AI' ? 'AI Game' : 
                          game.player2Alias === 'Local Player' ? 'Local Game' :
                          game.tournamentId ? 'Tournament' : 'Remote Game',
                    // Show clearly who won
                    opponent: `Winner: ${game.winnerAlias}`,
                    result: isPlayerWin ? 'WIN' : 'LOSS',
                    score: `${playerScore}-${opponentScore}`,
                    date: game.startedAt || game.createdAt || game.finishedAt,
                    duration: duration,
                    startedAt: game.startedAt,
                    createdAt: game.createdAt,
                    finishedAt: game.finishedAt
                };
            });

            // Calculate overall statistics
            const totalGames = totalAIGames + totalLocalGames + multiplayerGames + tournamentGames;
            const totalWins = aiWins + localWins + multiplayerWins + tournamentWins;
            const overallWinRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : 0;

            // Calculate achievements based on all game types
            const achievements = calculateAchievements({
                totalWins,
                totalGames,
                overallWinRate,
                aiWins,
                localWins,
                multiplayerWins,
                tournamentWins,
                aiGames: totalAIGames,
                localGames: totalLocalGames,
                multiplayerGames,
                tournamentGames
            });

            // Determine favorite game type
            let favoriteGameType = 'AI Games';
            if (totalLocalGames > totalAIGames && totalLocalGames > multiplayerGames && totalLocalGames > tournamentGames) {
                favoriteGameType = 'Local Games';
            } else if (multiplayerGames > totalAIGames && multiplayerGames > tournamentGames) {
                favoriteGameType = 'Remote Game';
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
                    localGameStats: {
                        totalGames: totalLocalGames,
                        wins: localWins,
                        losses: localLosses,
                        winRate: parseFloat(localWinRate),
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
                    achievements: achievements,
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

/**
 * Calculate comprehensive achievements based on all game types
 */
function calculateAchievements(stats) {
    const achievements = [];

    // 🏆 Win-Based Achievements (Overall)
    if (stats.totalWins >= 1) achievements.push({ 
        name: 'First Victory', 
        description: 'Win your first game', 
        icon: '🌟',
        category: 'milestone'
    });
    if (stats.totalWins >= 5) achievements.push({ 
        name: 'Getting Started', 
        description: 'Win 5 games', 
        icon: '🎮',
        category: 'milestone'
    });
    if (stats.totalWins >= 10) achievements.push({ 
        name: 'Rookie', 
        description: 'Win 10 games', 
        icon: '🌱',
        category: 'milestone'
    });
    if (stats.totalWins >= 25) achievements.push({ 
        name: 'Experienced', 
        description: 'Win 25 games', 
        icon: '⭐',
        category: 'milestone'
    });
    if (stats.totalWins >= 50) achievements.push({ 
        name: 'Veteran', 
        description: 'Win 50 games', 
        icon: '🎖️',
        category: 'milestone'
    });
    if (stats.totalWins >= 100) achievements.push({ 
        name: 'Centurion', 
        description: 'Win 100 games', 
        icon: '🏆',
        category: 'milestone'
    });

    // 🎯 Game Type Specific Achievements
    if (stats.aiWins >= 1) achievements.push({ 
        name: 'AI Slayer', 
        description: 'Beat the AI', 
        icon: '🤖',
        category: 'game_type'
    });
    if (stats.aiWins >= 5) achievements.push({ 
        name: 'AI Dominator', 
        description: 'Win 5 AI games', 
        icon: '🤖💪',
        category: 'game_type'
    });
    if (stats.aiWins >= 10) achievements.push({ 
        name: 'AI Master', 
        description: 'Win 10 AI games', 
        icon: '🤖👑',
        category: 'game_type'
    });

    if (stats.localWins >= 1) achievements.push({ 
        name: 'Local Champion', 
        description: 'Win a local game', 
        icon: '🎮',
        category: 'game_type'
    });
    if (stats.localWins >= 5) achievements.push({ 
        name: 'Local Legend', 
        description: 'Win 5 local games', 
        icon: '🎮🔥',
        category: 'game_type'
    });
    if (stats.localWins >= 10) achievements.push({ 
        name: 'Local King', 
        description: 'Win 10 local games', 
        icon: '🎮👑',
        category: 'game_type'
    });

    if (stats.multiplayerWins >= 1) achievements.push({ 
        name: 'Online Warrior', 
        description: 'Win an online game', 
        icon: '🔗',
        category: 'game_type'
    });
    if (stats.multiplayerWins >= 5) achievements.push({ 
        name: 'Online Champion', 
        description: 'Win 5 online games', 
        icon: '🔗💪',
        category: 'game_type'
    });
    if (stats.multiplayerWins >= 10) achievements.push({ 
        name: 'Online Legend', 
        description: 'Win 10 online games', 
        icon: '🔗👑',
        category: 'game_type'
    });

    if (stats.tournamentWins >= 1) achievements.push({ 
        name: 'Tournament Winner', 
        description: 'Win a tournament game', 
        icon: '🏆',
        category: 'game_type'
    });
    if (stats.tournamentWins >= 3) achievements.push({ 
        name: 'Tournament Champion', 
        description: 'Win 3 tournament games', 
        icon: '🏆💪',
        category: 'game_type'
    });
    if (stats.tournamentWins >= 5) achievements.push({ 
        name: 'Tournament Master', 
        description: 'Win 5 tournament games', 
        icon: '🏆👑',
        category: 'game_type'
    });

    // 📊 Win Rate Achievements (with minimum game requirements)
    if (stats.overallWinRate >= 50 && stats.totalGames >= 5) achievements.push({ 
        name: 'Balanced', 
        description: '50%+ win rate (5+ games)', 
        icon: '⚖️',
        category: 'performance'
    });
    if (stats.overallWinRate >= 60 && stats.totalGames >= 10) achievements.push({ 
        name: 'Skilled', 
        description: '60%+ win rate (10+ games)', 
        icon: '🎯',
        category: 'performance'
    });
    if (stats.overallWinRate >= 70 && stats.totalGames >= 15) achievements.push({ 
        name: 'Expert', 
        description: '70%+ win rate (15+ games)', 
        icon: '🎯💪',
        category: 'performance'
    });
    if (stats.overallWinRate >= 80 && stats.totalGames >= 20) achievements.push({ 
        name: 'Elite', 
        description: '80%+ win rate (20+ games)', 
        icon: '👑',
        category: 'performance'
    });
    if (stats.overallWinRate >= 90 && stats.totalGames >= 25) achievements.push({ 
        name: 'Legendary', 
        description: '90%+ win rate (25+ games)', 
        icon: '👑🔥',
        category: 'performance'
    });

    // 🎮 Game Variety Achievements
    const gameTypesPlayed = [
        stats.aiGames > 0,
        stats.localGames > 0,
        stats.multiplayerGames > 0,
        stats.tournamentGames > 0
    ].filter(Boolean).length;

    if (gameTypesPlayed >= 2) achievements.push({ 
        name: 'Versatile', 
        description: 'Play 2 different game types', 
        icon: '🎮🔄',
        category: 'variety'
    });
    if (gameTypesPlayed >= 3) achievements.push({ 
        name: 'Well-Rounded', 
        description: 'Play 3 different game types', 
        icon: '🎮🌟',
        category: 'variety'
    });
    if (gameTypesPlayed >= 4) achievements.push({ 
        name: 'Complete Player', 
        description: 'Play all game types', 
        icon: '🎮👑',
        category: 'variety'
    });

    // 🏃‍♂️ Activity Achievements
    if (stats.totalGames >= 10) achievements.push({ 
        name: 'Active Player', 
        description: 'Play 10 games', 
        icon: '🏃‍♂️',
        category: 'activity'
    });
    if (stats.totalGames >= 25) achievements.push({ 
        name: 'Dedicated Player', 
        description: 'Play 25 games', 
        icon: '🏃‍♂️💪',
        category: 'activity'
    });
    if (stats.totalGames >= 50) achievements.push({ 
        name: 'Power Player', 
        description: 'Play 50 games', 
        icon: '🏃‍♂️🔥',
        category: 'activity'
    });
    if (stats.totalGames >= 100) achievements.push({ 
        name: 'Game Master', 
        description: 'Play 100 games', 
        icon: '🏃‍♂️👑',
        category: 'activity'
    });

    // 🎯 Special Achievements
    if (stats.totalWins >= 1 && stats.totalGames === 1) achievements.push({ 
        name: 'Perfect Start', 
        description: 'Win your very first game', 
        icon: '✨',
        category: 'special'
    });
    if (stats.totalGames >= 5 && stats.overallWinRate >= 80) achievements.push({ 
        name: 'Consistent Winner', 
        description: '80%+ win rate with 5+ games', 
        icon: '🎯✨',
        category: 'special'
    });

    return achievements;
}

export default dashboardRoutes;
