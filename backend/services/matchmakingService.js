import { createMatchState } from './matchStateService.js';

// Queue of players waiting for a match
const waitingPlayers = new Map(); // userId -> { socket, username, timestamp }

// Active matches waiting for second player
const pendingMatches = new Map(); // matchId -> { player1, player2, timestamp }

let nextMatchId = 1;

export async function addPlayerToQueue(userId, socket, username) {
    console.log(`Player ${username} (${userId}) added to matchmaking queue`);
    
    // Store player in waiting queue
    waitingPlayers.set(userId, {
        socket,
        username,
        timestamp: Date.now()
    });
    
    // Try to find a match
    await tryMatchPlayers();
}

export function removePlayerFromQueue(userId) {
    console.log(`Player ${userId} removed from matchmaking queue`);
    waitingPlayers.delete(userId);
}

async function tryMatchPlayers() {
    const players = Array.from(waitingPlayers.entries());
    
    // Need at least 2 players to make a match
    if (players.length < 2) {
        console.log(`Not enough players in queue: ${players.length}`);
        return;
    }
    
    // Sort by timestamp (first come, first serve)
    players.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Take the first two players
    const [player1Id, player1Data] = players[0];
    const [player2Id, player2Data] = players[1];
    
    console.log(`Matching players: ${player1Data.username} vs ${player2Data.username}`);
    
    // Remove both players from queue
    waitingPlayers.delete(player1Id);
    waitingPlayers.delete(player2Id);
    
    // Create a new match
    const matchId = nextMatchId++;
    const match = await createMatchState(matchId, player1Data.username, player2Data.username);
    
    // Store match in pending matches
    pendingMatches.set(matchId, {
        player1: { id: player1Id, data: player1Data },
        player2: { id: player2Id, data: player2Data },
        timestamp: Date.now()
    });
    
    // Send match found message to both players
    const matchFoundMessage = JSON.stringify({
        type: 'match-found',
        matchId: matchId,
        message: `Match found! You will be connected to ${player1Data.username} vs ${player2Data.username}`
    });
    
    player1Data.socket.send(matchFoundMessage);
    player2Data.socket.send(matchFoundMessage);
    
    console.log(`Match ${matchId} created for ${player1Data.username} vs ${player2Data.username}`);
}

export function getQueueStatus() {
    return {
        waitingPlayers: waitingPlayers.size,
        pendingMatches: pendingMatches.size,
        queue: Array.from(waitingPlayers.entries()).map(([userId, data]) => ({
            userId,
            username: data.username,
            waitingSince: data.timestamp
        }))
    };
}

export function getPendingMatch(matchId) {
    return pendingMatches.get(matchId);
}

export function removePendingMatch(matchId) {
    pendingMatches.delete(matchId);
}

export function getWaitingPlayer(userId) {
    return waitingPlayers.get(userId);
}
