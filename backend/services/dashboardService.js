import { prisma } from '../prisma/prisma_lib.js';

/**
 * Comprehensive Dashboard Service
 * 
 * Provides aggregated statistics and analytics for all game types:
 * - AI Pong Games
 * - Remote Games
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

            // Look for AI games where user is involved (either as player1 or in match players)
            const totalGames = await prisma.match.count({
                where: {
                    player2Alias: 'AI',
                    status: 'FINISHED',
                    OR: [
                        { player1Alias: user.username },
                        { 
                            players: {
                                some: {
                                    alias: user.username
                                }
                            }
                        }
                    ]
                }
            });

            const wins = await prisma.match.count({
                where: {
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

            // Look for local games where user is involved
            const totalGames = await prisma.match.count({
                where: {
                    player2Alias: 'Local Player',
                    status: 'FINISHED',
                    OR: [
                        { player1Alias: user.username },
                        { 
                            players: {
                                some: {
                                    alias: user.username
                                }
                            }
                        }
                    ]
                }
            });

            const wins = await prisma.match.count({
                where: {
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
     * Get Remote Game Statistics (Remote/Online games)
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

            // Count multiplayer games for this user using matchPlayer for accuracy
            // Filters: non-AI, non-local, non-tournament, finished matches
            const baseMatchFilter = {
                player1Alias: { notIn: ['AI', 'Local Player'] },
                player2Alias: { notIn: ['AI', 'Local Player'] },
                tournamentId: null,
                status: 'FINISHED',
            };

            const totalGames = await prisma.matchPlayer.count({
                where: {
                    alias: user.username,
                    match: baseMatchFilter,
                }
            });

            const wins = await prisma.matchPlayer.count({
                where: {
                    alias: user.username,
                    result: 'WIN',
                    match: baseMatchFilter,
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
     * Get General Multiplayer Statistics (for public dashboard)
     */
    static async getGeneralMultiplayerStats() {
        try {
            // Count all multiplayer games (exclude AI games, local games, and tournament games)
            const totalGames = await prisma.match.count({
                where: {
                    player2Alias: { 
                        not: { in: ['AI', 'Local Player'] }
                    },
                    tournamentId: null, // Exclude tournament games
                    status: 'FINISHED'
                }
            });

            const wins = await prisma.match.count({
                where: {
                    player2Alias: { 
                        not: { in: ['AI', 'Local Player'] }
                    },
                    tournamentId: null, // Exclude tournament games
                    status: 'FINISHED',
                    winnerAlias: { not: null }
                }
            });

            const losses = totalGames - wins;
            const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0;

            return {
                totalGames,
                wins,
                losses,
                winRate: parseFloat(winRate),
                averageScore: 0, // Would need to calculate from match players
                bestScore: 0     // Would need to calculate from match players
            };
        } catch (error) {
            console.error('Error getting general multiplayer stats:', error);
            throw error;
        }
    }

    /**
     * Get Tournament Statistics
     */
    static async getTournamentStats(userId) {
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

            // Count tournament games (matches with tournamentId not null)
            const totalGames = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    tournamentId: { not: null }, // Only tournament games
                    status: 'FINISHED'
                }
            });

            const wins = await prisma.match.count({
                where: {
                    player1Alias: user.username,
                    tournamentId: { not: null }, // Only tournament games
                    status: 'FINISHED',
                    winnerAlias: user.username
                }
            });

            const losses = totalGames - wins;
            const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0;

            // Get best and average scores for tournament games
            const matchPlayers = await prisma.matchPlayer.findMany({
                where: {
                    match: {
                        player1Alias: user.username,
                        tournamentId: { not: null },
                        status: 'FINISHED'
                    },
                    alias: user.username
                },
                select: { score: true }
            });

            const scores = matchPlayers.map(mp => mp.score);
            const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
            const averageScore = scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : 0;

            return {
                totalGames,
                wins,
                losses,
                winRate: parseFloat(winRate),
                bestScore,
                averageScore
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

                let gameType = 'Remote Game';
                if (game.player2Alias === 'AI') {
                    gameType = 'AI Game';
                } else if (game.player2Alias === 'Local Player') {
                    gameType = 'Local Game';
                } else if (game.tournamentId) {
                    gameType = 'Tournament';
                }

                // Compute duration using available timestamps
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
                    id: game.id,
                    type: gameType,
                    opponent: `Winner: ${game.winnerAlias}`, // show winner name as requested
                    result: game.winnerAlias === user.username ? 'WIN' : 'LOSS',
                    score: `${playerScore} - ${opponentScore}`,
                    date: game.finishedAt || game.startedAt || game.createdAt,
                    duration,
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
     * Get User Achievements with all available achievements
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

            // Get all possible achievements with their requirements
            const allAchievements = this.getAllAchievements();
            
            // Mark achievements as unlocked based on current stats
            const userStats = {
                totalWins,
                totalGames,
                overallWinRate,
                aiWins: aiStats.wins,
                aiGames: aiStats.totalGames,
                localWins: localStats.wins,
                localGames: localStats.totalGames,
                multiplayerWins: mpStats.wins,
                multiplayerGames: mpStats.totalGames,
                tournamentWins: tournamentStats.wins,
                tournamentGames: tournamentStats.totalGames
            };

            return allAchievements.map(achievement => ({
                ...achievement,
                unlocked: this.isAchievementUnlocked(achievement, userStats),
                progress: this.getAchievementProgress(achievement, userStats)
            }));
        } catch (error) {
            console.error('Error getting user achievements:', error);
            return [];
        }
    }

    /**
     * Get all possible achievements with their requirements
     */
    static getAllAchievements() {
        return [
            // 🏆 Milestone Achievements
            { name: 'First Victory', description: 'Win your first game', icon: '🌟', category: 'milestone', requirement: '1 win', requirementValue: 1, requirementType: 'totalWins' },
            { name: 'Getting Started', description: 'Win 5 games', icon: '🎮', category: 'milestone', requirement: '5 wins', requirementValue: 5, requirementType: 'totalWins' },
            { name: 'Rookie', description: 'Win 10 games', icon: '🌱', category: 'milestone', requirement: '10 wins', requirementValue: 10, requirementType: 'totalWins' },
            { name: 'Experienced', description: 'Win 25 games', icon: '⭐', category: 'milestone', requirement: '25 wins', requirementValue: 25, requirementType: 'totalWins' },
            { name: 'Veteran', description: 'Win 50 games', icon: '🎖️', category: 'milestone', requirement: '50 wins', requirementValue: 50, requirementType: 'totalWins' },
            { name: 'Centurion', description: 'Win 100 games', icon: '🏆', category: 'milestone', requirement: '100 wins', requirementValue: 100, requirementType: 'totalWins' },

            // 🤖 AI Game Achievements
            { name: 'AI Slayer', description: 'Beat the AI', icon: '🤖', category: 'game_type', requirement: '1 AI win', requirementValue: 1, requirementType: 'aiWins' },
            { name: 'AI Dominator', description: 'Win 5 AI games', icon: '🤖💪', category: 'game_type', requirement: '5 AI wins', requirementValue: 5, requirementType: 'aiWins' },
            { name: 'AI Master', description: 'Win 10 AI games', icon: '🤖👑', category: 'game_type', requirement: '10 AI wins', requirementValue: 10, requirementType: 'aiWins' },

            // 🎮 Local Game Achievements
            { name: 'Local Champion', description: 'Win a local game', icon: '🎮', category: 'game_type', requirement: '1 local win', requirementValue: 1, requirementType: 'localWins' },
            { name: 'Local Legend', description: 'Win 5 local games', icon: '🎮🔥', category: 'game_type', requirement: '5 local wins', requirementValue: 5, requirementType: 'localWins' },
            { name: 'Local King', description: 'Win 10 local games', icon: '🎮👑', category: 'game_type', requirement: '10 local wins', requirementValue: 10, requirementType: 'localWins' },

            // 🔗 Remote Game Achievements
            { name: 'Online Warrior', description: 'Win an online game', icon: '🔗', category: 'game_type', requirement: '1 online win', requirementValue: 1, requirementType: 'multiplayerWins' },
            { name: 'Online Champion', description: 'Win 5 online games', icon: '🔗💪', category: 'game_type', requirement: '5 online wins', requirementValue: 5, requirementType: 'multiplayerWins' },
            { name: 'Online Legend', description: 'Win 10 online games', icon: '🔗👑', category: 'game_type', requirement: '10 online wins', requirementValue: 10, requirementType: 'multiplayerWins' },

            // 🏆 Tournament Game Achievements
            { name: 'Tournament Winner', description: 'Win a tournament game', icon: '🏆', category: 'game_type', requirement: '1 tournament win', requirementValue: 1, requirementType: 'tournamentWins' },
            { name: 'Tournament Champion', description: 'Win 3 tournament games', icon: '🏆💪', category: 'game_type', requirement: '3 tournament wins', requirementValue: 3, requirementType: 'tournamentWins' },
            { name: 'Tournament Master', description: 'Win 5 tournament games', icon: '🏆👑', category: 'game_type', requirement: '5 tournament wins', requirementValue: 5, requirementType: 'tournamentWins' },

            // 📊 Performance Achievements
            { name: 'Balanced', description: '50%+ win rate (5+ games)', icon: '⚖️', category: 'performance', requirement: '50% win rate (5+ games)', requirementValue: 50, requirementType: 'winRate', minGames: 5 },
            { name: 'Skilled', description: '60%+ win rate (10+ games)', icon: '🎯', category: 'performance', requirement: '60% win rate (10+ games)', requirementValue: 60, requirementType: 'winRate', minGames: 10 },
            { name: 'Expert', description: '70%+ win rate (15+ games)', icon: '🎯💪', category: 'performance', requirement: '70% win rate (15+ games)', requirementValue: 70, requirementType: 'winRate', minGames: 15 },
            { name: 'Elite', description: '80%+ win rate (20+ games)', icon: '👑', category: 'performance', requirement: '80% win rate (20+ games)', requirementValue: 80, requirementType: 'winRate', minGames: 20 },
            { name: 'Legendary', description: '90%+ win rate (25+ games)', icon: '👑🔥', category: 'performance', requirement: '90% win rate (25+ games)', requirementValue: 90, requirementType: 'winRate', minGames: 25 },

            // 🎮 Variety Achievements
            { name: 'Versatile', description: 'Play 2 different game types', icon: '🎮🔄', category: 'variety', requirement: '2 game types', requirementValue: 2, requirementType: 'gameTypes' },
            { name: 'Well-Rounded', description: 'Play 3 different game types', icon: '🎮🌟', category: 'variety', requirement: '3 game types', requirementValue: 3, requirementType: 'gameTypes' },
            { name: 'Complete Player', description: 'Play all game types', icon: '🎮👑', category: 'variety', requirement: '4 game types', requirementValue: 4, requirementType: 'gameTypes' },

            // 🏃‍♂️ Activity Achievements
            { name: 'Active Player', description: 'Play 10 games', icon: '🏃‍♂️', category: 'activity', requirement: '10 games played', requirementValue: 10, requirementType: 'totalGames' },
            { name: 'Dedicated Player', description: 'Play 25 games', icon: '🏃‍♂️💪', category: 'activity', requirement: '25 games played', requirementValue: 25, requirementType: 'totalGames' },
            { name: 'Power Player', description: 'Play 50 games', icon: '🏃‍♂️🔥', category: 'activity', requirement: '50 games played', requirementValue: 50, requirementType: 'totalGames' },
            { name: 'Game Master', description: 'Play 100 games', icon: '🏃‍♂️👑', category: 'activity', requirement: '100 games played', requirementValue: 100, requirementType: 'totalGames' },

            // ✨ Special Achievements
            { name: 'Perfect Start', description: 'Win your very first game', icon: '✨', category: 'special', requirement: 'Win first game (100% win rate)', requirementValue: 1, requirementType: 'perfectStart' },
            { name: 'Consistent Winner', description: '80%+ win rate with 5+ games', icon: '🎯✨', category: 'special', requirement: '80% win rate (5+ games)', requirementValue: 80, requirementType: 'consistentWinner', minGames: 5 }
        ];
    }

    /**
     * Check if an achievement is unlocked
     */
    static isAchievementUnlocked(achievement, stats) {
        switch (achievement.requirementType) {
            case 'totalWins':
                return stats.totalWins >= achievement.requirementValue;
            case 'aiWins':
                return stats.aiWins >= achievement.requirementValue;
            case 'localWins':
                return stats.localWins >= achievement.requirementValue;
            case 'multiplayerWins':
                return stats.multiplayerWins >= achievement.requirementValue;
            case 'tournamentWins':
                return stats.tournamentWins >= achievement.requirementValue;
            case 'totalGames':
                return stats.totalGames >= achievement.requirementValue;
            case 'winRate':
                return stats.overallWinRate >= achievement.requirementValue && stats.totalGames >= (achievement.minGames || 0);
            case 'gameTypes':
                const gameTypesPlayed = [
                    stats.aiGames > 0,
                    stats.localGames > 0,
                    stats.multiplayerGames > 0,
                    stats.tournamentGames > 0
                ].filter(Boolean).length;
                return gameTypesPlayed >= achievement.requirementValue;
            case 'perfectStart':
                return stats.totalWins >= 1 && stats.totalGames === 1;
            case 'consistentWinner':
                return stats.overallWinRate >= achievement.requirementValue && stats.totalGames >= (achievement.minGames || 0);
            default:
                return false;
        }
    }

    /**
     * Get achievement progress percentage
     */
    static getAchievementProgress(achievement, stats) {
        switch (achievement.requirementType) {
            case 'totalWins':
                return Math.min(100, (stats.totalWins / achievement.requirementValue) * 100);
            case 'aiWins':
                return Math.min(100, (stats.aiWins / achievement.requirementValue) * 100);
            case 'localWins':
                return Math.min(100, (stats.localWins / achievement.requirementValue) * 100);
            case 'multiplayerWins':
                return Math.min(100, (stats.multiplayerWins / achievement.requirementValue) * 100);
            case 'tournamentWins':
                return Math.min(100, (stats.tournamentWins / achievement.requirementValue) * 100);
            case 'totalGames':
                return Math.min(100, (stats.totalGames / achievement.requirementValue) * 100);
            case 'winRate':
                const winRateProgress = (stats.overallWinRate / achievement.requirementValue) * 100;
                const gamesProgress = stats.totalGames >= (achievement.minGames || 0) ? 100 : (stats.totalGames / (achievement.minGames || 1)) * 100;
                return Math.min(100, Math.min(winRateProgress, gamesProgress));
            case 'gameTypes':
                const gameTypesPlayed = [
                    stats.aiGames > 0,
                    stats.localGames > 0,
                    stats.multiplayerGames > 0,
                    stats.tournamentGames > 0
                ].filter(Boolean).length;
                return Math.min(100, (gameTypesPlayed / achievement.requirementValue) * 100);
            case 'perfectStart':
                return stats.totalGames >= 1 ? (stats.totalWins >= 1 ? 100 : 0) : 0;
            case 'consistentWinner':
                const winRateProgress2 = (stats.overallWinRate / achievement.requirementValue) * 100;
                const gamesProgress2 = stats.totalGames >= (achievement.minGames || 0) ? 100 : (stats.totalGames / (achievement.minGames || 1)) * 100;
                return Math.min(100, Math.min(winRateProgress2, gamesProgress2));
            default:
                return 0;
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
            { name: 'Remote Game', count: stats.multiplayerStats.totalGames },
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
            favoriteGameType: stats.aiGameStats.totalGames > stats.multiplayerStats.totalGames ? 'AI Games' : 'Remote Game',
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
