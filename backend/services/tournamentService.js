let currentTournament = null;
let tournamentId = 1;

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Creates a new tournament with the given name and player aliases
 * @param {string} name - Tournament name
 * @param {string[]} aliases - Array of player aliases (4 or 8 players)
 * @param {number|null} creatorId - Optional user ID of tournament creator
 * @returns {Promise<Object>} Created tournament with initial bracket
 */

export async function createNewTournament(name, aliases, creatorId = null) {
    // Validation
    if (!Array.isArray(aliases) || ![4, 8].includes(aliases.length)) {
        throw new Error('Tournament must have exactly 4 or 8 players');
    }

    const cleanAliases = aliases.map(alias => {
        if (typeof alias !== 'string' || alias.trim().length === 0) {
            throw new Error('All aliases must be non-empty strings');
        }
        return alias.trim();
    });

    // Check for duplicate aliases
    const uniqueAliases = new Set(cleanAliases.map(alias => alias.toLowerCase()));
    if (uniqueAliases.size !== cleanAliases.length) {
        throw new Error('All aliases must be unique');
    }

    try {
        const tournament = await prisma.$transaction(async (tx) => {
            const newTournament = await tx.tournament.create({
                data: {
                    name: name || 'Tournament',
                    maxPlayers: aliases.length,
                    status: 'ONGOING',
                    creatorId,
                    currentRound: 0
                }
            });

            const playerData = cleanAliases.map((alias, index) => ({
                tournamentId: newTournament.id,
                alias: alias,
                playerOrder: index + 1,
                userId: null
            }));

            await tx.tournamentPlayer.createMany({
                data: playerData
            });

            await generateBracket(tx, newTournament.id, cleanAliases);

            return await tx.tournament.findUnique({
                where: { id: newTournament.id },
                include: {
                    players: { orderBy: { playerOrder: 'asc' } },
                    matches: {
                        orderBy: [
                            { roundNumber: 'asc' },
                            { matchNumber: 'asc' }
                        ]
                    }
                }
            });
        });
        return mapTournamentForResponse(tournament);
    } catch (error) {
        console.error('Error creating tournament:', error);
        throw new Error(`Failed to create tournament: ${error.message}`);
    }
}

/**
 * Generates the initial bracket (first round matches) for a tournament
 * @param {Object} tx - Prisma transaction client
 * @param {number} tournamentId - Tournament ID
 * @param {string[]} aliases - Shuffled player aliases
 */

async function generateBracket(tx, tournamentId, aliases)
{
    const shuffled = [...aliases].sort(() => Math.random() - 0.5);
    
    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({
            tournamentId,
            roundNumber: 1,
            matchNumber: (i / 2) + 1,
            player1Alias: shuffled[i],
            player2Alias: shuffled[i + 1],
            status: 'PENDING'
        });
    }
    await tx.match.createMany({
        data: matches
    });
}

/**
* Gets the current active match in a tournament
* @param {number|null} tournamentId - Optional tournament ID, gets latest if null
* @returns {Promise<Object|null>} Current match or null
*/

export async function getCurrentMatch(tournamentId = null)
{
    try 
    {
        let tournament;
        if (tournamentId)
        {
            tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId }
            });
        } 
        else
        {
            tournament = await prisma.tournament.findFirst({
                where: { status: 'ONGOING' },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (!tournament)
            return null;

        const currentMatch = await prisma.match.findFirst({
            where: {
                tournamentId: tournament.id,
                status: 'PENDING'
            },
            orderBy: [
                { roundNumber: 'asc' },
                { matchNumber: 'asc' }
            ]
        });

        if (!currentMatch)
            return null;

        const totalMatchesInRound = await prisma.match.count({
            where: {
                tournamentId: tournament.id,
                roundNumber: currentMatch.roundNumber
            }
        });

        return {
            id: currentMatch.id,
            player1: { alias: currentMatch.player1Alias },
            player2: { alias: currentMatch.player2Alias },
            status: currentMatch.status.toLowerCase(),
            roundNumber: currentMatch.roundNumber,
            matchNumber: currentMatch.matchNumber,
            totalMatches: totalMatchesInRound,
            tournamentId: tournament.id
        };
    } 
    catch (error)
    {
        console.error('Error getting current match:', error);
        throw new Error(`Failed to get current match: ${error.message}`);
    }
}

/**
 * Completes a match and advances tournament state
 * @param {number} matchId - Match ID
 * @param {string} winnerAlias - Alias of the winning player
 * @returns {Promise<Object>} Result of match completion
 */

export async function completeMatch(matchId, winnerAlias) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
                include: { tournament: true }
            });

            if (!match)
                return { error: 'Match not found' };

            if (match.status !== 'PENDING')
                return { error: 'Match already completed' };

            if (match.player1Alias !== winnerAlias && match.player2Alias !== winnerAlias)
                return { error: 'Invalid winner - must be one of the match players' };

            const updatedMatch = await tx.match.update({
                where: { id: matchId },
                data: {
                    status: 'FINISHED',
                    winnerAlias,
                    finishedAt: new Date()
                }
            });

            await tx.matchPlayer.createMany({
                data: [
                    {
                        matchId: matchId,
                        alias: match.player1Alias,
                        result: match.player1Alias === winnerAlias ? 'WIN' : 'LOSS'
                    },
                    {
                        matchId: matchId,
                        alias: match.player2Alias,
                        result: match.player2Alias === winnerAlias ? 'WIN' : 'LOSS'
                    }
                ]
            });

            const pendingMatches = await tx.match.count({
                where: {
                    tournamentId: match.tournamentId,
                    roundNumber: match.roundNumber,
                    status: 'PENDING'
                }
            });

            if (pendingMatches === 0)
                await advanceToNextRound(tx, match.tournamentId, match.roundNumber);

            return { success: true, match: updatedMatch };
        });

        return result;
    } catch (error) {
        console.error('Error completing match:', error);
        return { error: `Failed to complete match: ${error.message}` };
    }
}

/**
 * Advances tournament to next round or completes it
 * @param {Object} tx - Prisma transaction client
 * @param {number} tournamentId - Tournament ID
 * @param {number} completedRound - The round that just completed
 */
async function advanceToNextRound(tx, tournamentId, completedRound)
{
    const winners = await tx.match.findMany({
        where: {
            tournamentId,
            roundNumber: completedRound,
            status: 'FINISHED'
        },
        select: { winnerAlias: true },
        orderBy: { matchNumber: 'asc' }
    });

    const winnerAliases = winners.map(w => w.winnerAlias);

    if (winnerAliases.length === 1)
    {
        await tx.tournament.update({
            where: { id: tournamentId },
            data: {
                status: 'FINISHED',
                winnerAlias: winnerAliases[0]
            }
        });
        return;
    }

    const nextRound = completedRound + 1;
    const nextRoundMatches = [];

    for (let i = 0; i < winnerAliases.length; i += 2) {
        nextRoundMatches.push({
            tournamentId,
            roundNumber: nextRound,
            matchNumber: (i / 2) + 1,
            player1Alias: winnerAliases[i],
            player2Alias: winnerAliases[i + 1],
            status: 'PENDING'
        });
    }

    await tx.match.createMany({
        data: nextRoundMatches
    });

    await tx.tournament.update({
        where: { id: tournamentId },
        data: { currentRound: nextRound - 1 }
    });
}

/**
 * Gets tournament details with bracket
 * @param {number|null} tournamentId - Optional tournament ID, gets latest if null
 * @returns {Promise<Object|null>} Tournament with bracket or null
 */
export async function getTournament(tournamentId = null)
{
    try {
        let tournament;
        if (tournamentId) {
            tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: {
                    players: { orderBy: { playerOrder: 'asc' } },
                    matches: {
                        orderBy: [
                            { roundNumber: 'asc' },
                            { matchNumber: 'asc' }
                        ]
                    }
                }
            });
        }
        else
        {
            tournament = await prisma.tournament.findFirst({
                where: { status: { in: ['ONGOING', 'FINISHED'] } },
                orderBy: { createdAt: 'desc' },
                include: {
                    players: { orderBy: { playerOrder: 'asc' } },
                    matches: {
                        orderBy: [
                            { roundNumber: 'asc' },
                            { matchNumber: 'asc' }
                        ]
                    }
                }
            });
        }

        if (!tournament)
            return null;

        return mapTournamentForResponse(tournament);

    } catch (error) {
        console.error('Error getting tournament:', error);
        throw new Error(`Failed to get tournament: ${error.message}`);
    }
}

/**
 * Gets tournament bracket structure
 * @param {number|null} tournamentId - Optional tournament ID, gets latest if null
 * @returns {Promise<Object|null>} Tournament bracket or null
 */
export async function getTournamentBracket(tournamentId = null)
{
    const tournament = await getTournament(tournamentId);
    if (!tournament)
        return null;

    return {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        participants: tournament.participants,
        bracket: tournament.bracket,
        currentRound: tournament.currentRound + 1,
        winner: tournament.winner
    };
}

/**
 * Resets/deletes current tournament and all related data
 * @param {number|null} tournamentId - Optional tournament ID, deletes latest if null
 * @returns {Promise<boolean>} Success status
 */

export async function resetTournament(tournamentId = null)
{
    try {
        let tournamentsToDelete;

        if (tournamentId)
            tournamentsToDelete = [tournamentId];
        else
        {
            const tournaments = await prisma.tournament.findMany({
                where: { status: { in: ['ONGOING', 'FINISHED'] } },
                select: { id: true }
            });
            tournamentsToDelete = tournaments.map(t => t.id);
        }

        if (tournamentsToDelete.length === 0)
            return true;

        await prisma.tournament.deleteMany({
            where: { id: { in: tournamentsToDelete } }
        });

        return true;
    }
    catch (error)
    {
        console.error('Error resetting tournament:', error);
        throw new Error(`Failed to reset tournament: ${error.message}`);
    }
}

/**
 * Maps database tournament to API response format
 * @param {Object} tournament - Tournament from database with includes
 * @returns {Object} Formatted tournament object
 */
function mapTournamentForResponse(tournament)
{
    const bracket = [];
    const matchesByRound = {};

    tournament.matches.forEach(match => {
        if (!matchesByRound[match.roundNumber])
            matchesByRound[match.roundNumber] = [];
        matchesByRound[match.roundNumber].push({
            id: match.id,
            player1: { alias: match.player1Alias },
            player2: { alias: match.player2Alias },
            winner: match.winnerAlias ? { alias: match.winnerAlias } : null,
            status: match.status.toLowerCase()
        });
    });

    const roundNumbers = Object.keys(matchesByRound).map(Number).sort();
    roundNumbers.forEach(roundNum => {
        bracket.push(matchesByRound[roundNum]);
    });

    return {
        id: tournament.id,
        name: tournament.name,
        maxPlayers: tournament.maxPlayers,
        status: tournament.status.toLowerCase(),
        participants: tournament.players.map(p => ({
            id: p.playerOrder,
            alias: p.alias
        })),
        bracket,
        currentRound: tournament.currentRound,
        winner: tournament.winnerAlias ? { alias: tournament.winnerAlias } : null
    };
}