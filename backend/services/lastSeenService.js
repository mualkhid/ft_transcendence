import {prisma} from '../prisma/prisma_lib.js'

const lastSeenCache = new Map();

export async function updateLastSeenIfNeeded(id) {
    const now = Date.now();
    const lastUpdate = lastSeenCache.get(id) || 0;

    if (now - lastUpdate > 1 * 60 * 1000) {
        lastSeenCache.set(id, now);
        
        await prisma.user.update({
            where: { id: id },
            data: { lastSeen: new Date(now) }
        });
    }
}

export function trackUserActivity(request, reply, done) {
    if (request.user?.id) {
        updateLastSeenIfNeeded(request.user.id);
    }
    else
        console.log("no user is sent")
    done();
}

export function cleanCache() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const entry of lastSeenCache.entries()) {
        const userId = entry[0];
        const timestamp = entry[1];

        if (timestamp < oneHourAgo) {
            lastSeenCache.delete(userId);
        }
    }
}

export const cleanupInterval = setInterval(cleanCache, 60 * 60 * 1000);