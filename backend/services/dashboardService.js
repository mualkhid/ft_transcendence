import { prisma } from '../prisma/prisma_lib.js';

/**
 * Comprehensive Dashboard Service
 * 
 * Provides aggregated statistics and analytics for all game types:
 * - AI Pong Games
 * - Remote Multiplayer Games
 * - Tournament Games
 * - User Performance Metrics
 * - Game Trends and Insights
 */

export class DashboardService {
    
    /**
     * Get comprehensive user dashboard data
     */
    static async getUserDashboard(userId) {
        try {
            const [
                aiGameStats,
                localGameStats,
                multiplayerStats,
                tournamentStats,
                recentGames,
                performanceMetrics,
                achievements
            ] = await Promise.all([
                this.getAIGameStats(userId),
                this.getLocalGameStats(userId),
                this.getMultiplayerStats(userId),
                this.getTournamentStats(userId),
                this.getRecentGames(userId),
                this.getPerformanceMetrics(userId),
                this.getUserAchievements(userId)
            ]);

            return {
                success: true,
                data: {
                    aiGameStats,
                    localGameStats,
                    multiplayerStats,
                    tournamentStats,
                    recentGames,
                    performanceMetrics,
                    achievements,
                    summary: this.generateSummary({
                        aiGameStats,
                        localGameStats,
                        multiplayerStats,
                        tournamentStats,
                        performanceMetrics
                    })
                }
            };
        } catch (error) {
            console.error('Error getting user dashboard:', error);
            throw new Error('Failed to load dashboard data');
        }
    }

    /**
     * Get general dashboard data (public access)
     */
    static async getGeneralDashboard() {
        try {
            const [
                aiGameStats,
                multiplayerStats,
                tournamentStats,
                recentGames
            ] = await Promise.all([
                this.getGeneralAIGameStats(),
                this.getGeneralMultiplayerStats(),
                this.getGeneralTournamentStats(),
                this.getGeneralRecentGames()
            ]);

            return {
                success: true,
                data: {
                    aiGameStats,
                    multiplayerStats,
                    tournamentStats,
                    recentGames,
                    summary: this.generateGeneralSummary({
                        aiGameStats,
                        multiplayerStats,
                        tournamentStats
                    })
                }
            };
        } catch (error) {
            console.error('Error getting general dashboard:', error);
            throw new Error('Failed to load general dashboard data');
        }
    }

    /**
     * Get AI Game Statistics
     */
    static async getAIGameStats(userId) {
        try {
            // Get user info to match against player1Alias
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true }
            });

            if (!user) {
                return {
                    totalGames: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    difficultyStats: {},
                    recentGames: [],
                    averageScore: 0,
                    bestScore: 0,
                    longestWinStreak: 0,
                    currentStreak: 0
                };
            }

            const totalGames = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    player2Alias: 'AI',
                    status: 'FINISHED'
                }
            });

            const wins = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    player2Alias: 'AI',
                    status: 'FINISHED',
                    winnerAlias: user.username
                }
            });

            const losses = totalGames - wins;
            const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0;

            // Get difficulty breakdown
            const difficultyStats = await this.getAIGameDifficultyStats();

            // Get recent AI game performance
            const recentAIGames = await prisma.match.findMany({
                where: {
                    player1Alias: user.username,
                    player2Alias: 'AI',
                    status: 'FINISHED'
                },
                include: {
                    players: true
                },
                orderBy: { finishedAt: 'desc' },
                take: 10
            });

            return {
                totalGames,
                wins,
                losses,
                winRate: parseFloat(winRate),
                difficultyStats,
                recentGames: recentAIGames,
                averageScore: await this.calculateAverageScore('AI'),
                bestScore: await this.getBestScore('AI'),
                longestWinStreak: await this.getLongestWinStreak('AI'),
                currentStreak: await this.getCurrentStreak('AI')
            };
        } catch (error) {
            console.error('Error getting AI game stats:', error);
            throw error;
        }
    }

    /**
     * Get Local Game Statistics (1 vs 1 on same device)
     */
    static async getLocalGameStats(userId) {
        try {
            // Get user info to match against player1Alias
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true }
            });

            if (!user) {
                return {
                    totalGames: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    bestScore: 0,
                    averageScore: 0
                };
            }

            // Count local games where user is player1 and player2 is 'Local Player'
            const totalGames = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    player2Alias: 'Local Player',
                    status: 'FINISHED'
                }
            });

            const wins = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    player2Alias: 'Local Player',
                    status: 'FINISHED',
                    winnerAlias: user.username
                }
            });

            const losses = totalGames - wins;
            const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0;

            // Get best and average scores for local games
            const matchPlayers = await prisma.matchPlayer.findMany({
                where: {
                    match: {
                        player1Alias: user.username,
                        player2Alias: 'Local Player',
                        status: 'FINISHED'
                    },
                    alias: user.username
                },
                select: { score: true }
            });

            const scores = matchPlayers.map(mp => mp.score || 0);
            const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
            const averageScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

            return {
                totalGames,
                wins,
                losses,
                winRate: parseFloat(winRate),
                bestScore,
                averageScore: parseFloat(averageScore)
            };
        } catch (error) {
            console.error('Error getting local game stats:', error);
            throw error;
        }
    }

    /**
     * Get Multiplayer Game Statistics (Remote/Online games)
     */
    static async getMultiplayerStats(userId) {
        try {
            // Get user info to match against player1Alias
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true }
            });

            if (!user) {
                return {
                    totalGames: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    bestOpponent: 'N/A',
                    totalGames: 0
                };
            }

            // Count multiplayer games (exclude AI games and local games)
            const totalGames = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    player2Alias: { 
                        not: { in: ['AI', 'Local Player'] }
                    },
                    status: 'FINISHED'
                }
            });

            const wins = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    player2Alias: { 
                        not: { in: ['AI', 'Local Player'] }
                    },
                    status: 'FINISHED',
                    winnerAlias: user.username
                }
            });

            const losses = totalGames - wins;
            const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0;

            // Get opponent statistics
            const opponentStats = await this.getOpponentStats();

            return {
                totalGames,
                wins,
                losses,
                winRate: parseFloat(winRate),
                opponentStats,
                averageScore: await this.calculateAverageScore('multiplayer'),
                bestScore: await this.getBestScore('multiplayer'),
                longestWinStreak: await this.getLongestWinStreak('multiplayer'),
                currentStreak: await this.getCurrentStreak('multiplayer')
            };
        } catch (error) {
            console.error('Error getting multiplayer stats:', error);
            throw error;
        }
    }

    /**
     * Get Tournament Statistics
     */
    static async getTournamentStats(userId) {
        try {
            const tournaments = await prisma.tournament.findMany({
                where: {
                    players: {
                        some: { userId: userId }
                    }
                },
                include: {
                    players: true,
                    matches: true
                }
            });

            const totalTournaments = tournaments.length;
            const tournamentsWon = tournaments.filter(t => t.winnerId === userId).length;
            const winRate = totalTournaments > 0 ? (tournamentsWon / totalTournaments * 100).toFixed(1) : 0;

            // Get tournament performance over time
            const performanceOverTime = await this.getTournamentPerformanceOverTime(userId);

            // Get current tournament if any
            const currentTournament = await this.getCurrentTournament();

            return {
                totalTournaments,
                tournamentsWon,
                winRate: parseFloat(winRate),
                performanceOverTime,
                averageRank: await this.calculateAverageTournamentRank(userId),
                bestFinish: await this.getBestTournamentFinish(userId),
                totalMatches: tournaments.reduce((sum, t) => sum + t.matches.length, 0),
                currentTournament: currentTournament ? {
                    id: currentTournament.id,
                    name: currentTournament.name,
                    status: currentTournament.status,
                    currentRound: currentTournament.currentRound,
                    maxPlayers: currentTournament.maxPlayers
                } : null
            };
        } catch (error) {
            console.error('Error getting tournament stats:', error);
            throw error;
        }
    }

    /**
     * Get Recent Games (All Types)
     */
    static async getRecentGames(userId, limit = 20) {
        try {
            // Get user info to match against player1Alias
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true }
            });

            if (!user) {
                console.log('❌ No user found for userId:', userId);
                return [];
            }

            console.log('🔍 Looking for recent games for user:', user.username);

            const recentGames = await prisma.match.findMany({
                where: {
                    player1Alias: user.username,
                    status: 'FINISHED'
                },
                include: {
                    players: true,
                    tournament: true
                },
                orderBy: { finishedAt: 'desc' },
                take: limit
            });

            console.log('🎮 Found recent games:', recentGames.length, 'games');
            console.log('🎮 Recent games data:', recentGames);

            return recentGames.map(game => {
                const playerScore = game.players.find(p => p.alias === user.username)?.score || 0;
                const opponentScore = game.players.find(p => p.alias !== user.username)?.score || 0;
                
                let gameType = 'Multiplayer';
                if (game.player2Alias === 'AI') {
                    gameType = 'AI Game';
                } else if (game.player2Alias === 'Local Player') {
                    gameType = 'Local Game';
                } else if (game.tournamentId) {
                    gameType = 'Tournament';
                }

                return {
                    id: game.id,
                    type: gameType,
                    opponent: game.player2Alias,
                    result: game.winnerAlias === user.username ? 'WIN' : 'LOSS',
                    score: `${playerScore} - ${opponentScore}`,
                    date: game.finishedAt,
                    tournament: game.tournament?.name || null
                };
            });
        } catch (error) {
            console.error('Error getting recent games:', error);
            throw error;
        }
    }

    /**
     * Get Performance Metrics
     */
    static async getPerformanceMetrics(userId) {
        try {
            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);

            const gamesLast30Days = await prisma.match.count({
                where: {
                    status: 'FINISHED',
                    finishedAt: { gte: last30Days }
                }
            });

            const winRateLast30Days = await this.calculateWinRateLast30Days(userId);
            const averageGameDuration = await this.calculateAverageGameDuration();
            const improvementTrend = await this.calculateImprovementTrend(userId);

            return {
                gamesLast30Days,
                winRateLast30Days,
                averageGameDuration,
                improvementTrend,
                totalPlayTime: await this.calculateTotalPlayTime(userId),
                favoriteGameType: await this.getFavoriteGameType(userId),
                peakPerformance: await this.getPeakPerformance(userId)
            };
        } catch (error) {
            console.error('Error getting performance metrics:', error);
            throw error;
        }
    }

    /**
     * Get User Achievements
     */
    static async getUserAchievements(userId) {
        try {
            // Get all game stats to calculate overall achievements
            const [aiStats, localStats, mpStats, tournamentStats] = await Promise.all([
                this.getAIGameStats(userId),
                this.getLocalGameStats(userId),
                this.getMultiplayerStats(userId),
                this.getTournamentStats(userId)
            ]);

            // Calculate overall stats
            const totalWins = aiStats.wins + localStats.wins + mpStats.wins + tournamentStats.wins;
            const totalGames = aiStats.totalGames + localStats.totalGames + mpStats.totalGames + tournamentStats.totalGames;
            const overallWinRate = totalGames > 0 ? (totalWins / totalGames * 100) : 0;

            const achievements = [];

            // Win-based achievements
            if (totalWins >= 100) achievements.push({ name: 'Centurion', description: 'Win 100 games', icon: '🏆' });
            if (totalWins >= 50) achievements.push({ name: 'Veteran', description: 'Win 50 games', icon: '🎖️' });
            if (totalWins >= 25) achievements.push({ name: 'Experienced', description: 'Win 25 games', icon: '⭐' });
            if (totalWins >= 10) achievements.push({ name: 'Rookie', description: 'Win 10 games', icon: '🌱' });
            if (totalWins >= 5) achievements.push({ name: 'Getting Started', description: 'Win 5 games', icon: '🎮' });
            if (totalWins >= 1) achievements.push({ name: 'First Victory', description: 'Win your first game', icon: '🌟' });

            // Game type specific achievements
            if (aiStats.wins >= 1) achievements.push({ name: 'AI Slayer', description: 'Beat the AI', icon: '🤖' });
            if (localStats.wins >= 1) achievements.push({ name: 'Local Champion', description: 'Win a local game', icon: '🎮' });
            if (mpStats.wins >= 1) achievements.push({ name: 'Online Warrior', description: 'Win an online game', icon: '🔗' });
            if (tournamentStats.wins >= 1) achievements.push({ name: 'Tournament Winner', description: 'Win a tournament game', icon: '🏆' });

            // Win rate achievements
            if (overallWinRate >= 80) achievements.push({ name: 'Elite', description: '80%+ win rate', icon: '👑' });
            if (overallWinRate >= 60) achievements.push({ name: 'Skilled', description: '60%+ win rate', icon: '🎯' });
            if (overallWinRate >= 50) achievements.push({ name: 'Balanced', description: '50%+ win rate', icon: '⚖️' });

            return achievements;
        } catch (error) {
            console.error('Error getting user achievements:', error);
            return [];
        }
    }

    /**
     * Helper Methods
     */
    static async getAIGameDifficultyStats() {
        // This would be implemented when difficulty tracking is added to the database
        return {
            EASY: { games: 0, wins: 0, winRate: 0 },
            MEDIUM: { games: 0, wins: 0, winRate: 0 },
            HARD: { games: 0, wins: 0, winRate: 0 },
            EXPERT: { games: 0, wins: 0, winRate: 0 }
        };
    }

    static async getOpponentStats() {
        try {
            const opponents = await prisma.match.groupBy({
                by: ['player2Alias'],
                where: {
                    player2Alias: { not: 'AI' },
                    status: 'FINISHED'
                },
                _count: { id: true },
                _sum: { id: true }
            });

            return opponents.map(opponent => ({
                name: opponent.player2Alias,
                gamesPlayed: opponent._count.id,
                winRate: 0 // Would calculate based on actual wins
            }));
        } catch (error) {
            return [];
        }
    }

    static async calculateAverageScore(gameType) {
        try {
            const matches = await prisma.match.findMany({
                where: {
                    status: 'FINISHED',
                    player2Alias: gameType === 'AI' ? 'AI' : { not: 'AI' }
                },
                include: { players: true }
            });

            if (matches.length === 0) return 0;

            const totalScore = matches.reduce((sum, match) => {
                const playerScore = match.players.find(p => p.alias === 'Player')?.score || 0;
                return sum + playerScore;
            }, 0);

            return Math.round(totalScore / matches.length);
        } catch (error) {
            console.error('Error calculating average score:', error);
            return 0;
        }
    }

    static async getBestScore(gameType) {
        try {
            const matches = await prisma.match.findMany({
                where: {
                    status: 'FINISHED',
                    player2Alias: gameType === 'AI' ? 'AI' : { not: 'AI' }
                },
                include: { players: true }
            });

            if (matches.length === 0) return 0;

            const bestScore = Math.max(...matches.map(match => {
                const playerScore = match.players.find(p => p.alias === 'Player')?.score || 0;
                return playerScore;
            }));

            return bestScore;
        } catch (error) {
            return 0;
        }
    }

    static async getLongestWinStreak(gameType) {
        try {
            const matches = await prisma.match.findMany({
                where: {
                    status: 'FINISHED',
                    player2Alias: gameType === 'AI' ? 'AI' : { not: 'AI' }
                },
                include: { players: true },
                orderBy: { finishedAt: 'asc' }
            });

            if (matches.length === 0) return 0;

            let currentStreak = 0;
            let longestStreak = 0;

            for (const match of matches) {
                const playerWon = match.players.find(p => p.alias === 'Player')?.result === 'WIN';
                
                if (playerWon) {
                    currentStreak++;
                    longestStreak = Math.max(longestStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            }

            return longestStreak;
        } catch (error) {
            console.error('Error calculating longest win streak:', error);
            return 0;
        }
    }

    static async getCurrentStreak(gameType) {
        try {
            const matches = await prisma.match.findMany({
                where: {
                    status: 'FINISHED',
                    player2Alias: gameType === 'AI' ? 'AI' : { not: 'AI' }
                },
                include: { players: true },
                orderBy: { finishedAt: 'desc' }
            });

            if (matches.length === 0) return 0;

            let currentStreak = 0;

            for (const match of matches) {
                const playerWon = match.players.find(p => p.alias === 'Player')?.result === 'WIN';
                
                if (playerWon) {
                    currentStreak++;
                } else {
                    break; // Streak ends when a loss is encountered
                }
            }

            return currentStreak;
        } catch (error) {
            console.error('Error calculating current streak:', error);
            return 0;
        }
    }

    static async getCurrentTournament() {
        try {
            const tournament = await prisma.tournament.findFirst({
                where: {
                    status: { in: ['ACTIVE'] }
                },
                include: {
                    players: true,
                    matches: {
                        orderBy: [
                            { roundNumber: 'asc' },
                            { matchNumber: 'asc' }
                        ]
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return tournament;
        } catch (error) {
            console.error('Error getting current tournament:', error);
            return null;
        }
    }

    static async getTournamentPerformanceOverTime(userId) {
        // Implementation would track tournament performance over time
        return [];
    }

    static async calculateAverageTournamentRank(userId) {
        // Implementation would calculate average tournament ranking
        return 0;
    }

    static async getBestTournamentFinish(userId) {
        // Implementation would get best tournament finish
        return 'N/A';
    }

    static async calculateWinRateLast30Days(userId) {
        // Implementation would calculate recent win rate
        return 0;
    }

    static async calculateAverageGameDuration() {
        // Implementation would calculate average game duration
        return '5 min';
    }

    static async calculateImprovementTrend(userId) {
        // Implementation would calculate improvement trend
        return 'stable';
    }

    static async calculateTotalPlayTime(userId) {
        // Implementation would calculate total play time
        return '2 hours';
    }

    static async getFavoriteGameType(userId) {
        // Implementation would determine favorite game type
        return 'AI Games';
    }

    static async getPeakPerformance(userId) {
        // Implementation would get peak performance metrics
        return '80% win rate';
    }

    static generateSummary(stats) {
        const totalGames = stats.aiGameStats.totalGames + stats.localGameStats.totalGames + stats.multiplayerStats.totalGames + stats.tournamentStats.totalGames;
        const totalWins = stats.aiGameStats.wins + stats.localGameStats.wins + stats.multiplayerStats.wins + stats.tournamentStats.wins;
        const overallWinRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : 0;

        // Determine favorite game type
        const gameTypes = [
            { name: 'AI Games', count: stats.aiGameStats.totalGames },
            { name: 'Local Games', count: stats.localGameStats.totalGames },
            { name: 'Multiplayer', count: stats.multiplayerStats.totalGames },
            { name: 'Tournaments', count: stats.tournamentStats.totalGames }
        ];
        const favoriteGameType = gameTypes.reduce((max, current) => 
            current.count > max.count ? current : max
        ).name;

        return {
            totalGames,
            totalWins,
            overallWinRate: parseFloat(overallWinRate),
            favoriteGameType,
            skillLevel: this.calculateSkillLevel(parseFloat(overallWinRate))
        };
    }

    static generateGeneralSummary(stats) {
        const totalGames = stats.aiGameStats.totalGames + stats.multiplayerStats.totalGames;
        const totalWins = stats.aiGameStats.wins + stats.multiplayerStats.wins;
        const overallWinRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : 0;

        return {
            totalGames,
            totalWins,
            overallWinRate: parseFloat(overallWinRate),
            favoriteGameType: stats.aiGameStats.totalGames > stats.multiplayerStats.totalGames ? 'AI Games' : 'Multiplayer',
            skillLevel: this.calculateSkillLevel(parseFloat(overallWinRate))
        };
    }

    static calculateSkillLevel(winRate) {
        if (winRate >= 80) return { level: 'Elite', color: '#7c3aed', icon: '👑' };
        if (winRate >= 60) return { level: 'Skilled', color: '#f59e0b', icon: '🎯' };
        if (winRate >= 40) return { level: 'Intermediate', color: '#10b981', icon: '⭐' };
        return { level: 'Beginner', color: '#ef4444', icon: '🌱' };
    }
}

export default DashboardService;
