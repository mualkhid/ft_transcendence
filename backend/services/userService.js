export const users = new Map();
export let nextUserId = 1;

export const matches = new Map();
export let nextMatchId = 1;

export function generateUserId(){
    return nextUserId++;
}

export function generateMatchId(){
    return nextMatchId++;
}

