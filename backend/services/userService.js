const users = new Map();
let nextUserId = 1;

const matches = new Map();
let nextMatchId = 1;

function generateUserId(){
    return nextUserId++;
}

function generateMatchId(){
    return nextMatchId++;
}

module.exports = {
    users,
    matches,
    generateUserId,
    generateMatchId,
    nextMatchId
};