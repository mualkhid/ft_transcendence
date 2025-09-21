import { WebSocketServer } from 'ws';
import { handleAIGame } from '../controller/aiGameController.js';
import { handleRemoteGame } from '../controller/remoteGameController.js';

export function setupWebSocketServer() {
    const wss = new WebSocketServer({ port: 3001 });
        
    wss.on('connection', (ws, request) => {
        const url = new URL(request.url, 'https://localhost:3001');
        const path = url.pathname;
                
        if (path === '/ai-game') {
            console.log('🤖 AI Game WebSocket connection');
            handleAIGame(ws, request);
            return;
        }
                
        // Handle remote game connections
        if (path.startsWith('/simple-remote/')) {
            console.log('🎮 Simple remote game WebSocket connection');
            
            // Extract matchId from path
            const matchId = path.split('/').pop();
            const username = url.searchParams.get('username') || 'Anonymous';
            
            console.log(`Extracted matchId: "${matchId}", username: "${username}"`);
            
            // Validate matchId
            if (!matchId || matchId === 'simple-remote' || isNaN(parseInt(matchId))) {
                console.error(`Invalid matchId: "${matchId}"`);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid match ID format'
                }));
                ws.close(1002, 'Invalid match ID');
                return;
            }
            
            // Pass correct parameters
            handleRemoteGame(ws, matchId, username);
            return;
        }
                
        // Default handler for other remote game connections
        const matchId = path.split('/').pop();
        const username = url.searchParams.get('username') || 'Anonymous';
        
        // Validate matchId for default handler too
        if (!matchId || isNaN(parseInt(matchId))) {
            console.error(`Invalid matchId in default handler: "${matchId}"`);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid match ID format'
            }));
            ws.close(1002, 'Invalid match ID');
            return;
        }
                
        handleRemoteGame(ws, matchId, username);
    });
        
    return wss;
}