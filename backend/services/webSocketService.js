import { WebSocketServer } from 'ws';
import { handleAIGame } from '../controller/aiGameController.js';
import { handleSimpleRemoteGame } from '../controller/remoteGameController.js';

export function setupWebSocketServer() {
    // Create WebSocket server for remote game
    const wss = new WebSocketServer({ port: 3001 });
    
    wss.on('connection', (ws, request) => {
        console.log('🔌 WebSocket connection established!');
        const url = new URL(request.url, 'http://localhost:3001');
        const path = url.pathname;
        
        // Handle AI game WebSocket connection
        if (path === '/ai-game') {
            console.log('🤖 AI Game WebSocket connection');
            handleAIGame(ws, request);
            return;
        }
        
        // Handle simple remote game connections
        if (path.startsWith('/simple-remote/')) {
            console.log('🎮 Simple remote game WebSocket connection');
            handleSimpleRemoteGame(ws, request);
            return;
        }
        
        // Default handler for other remote game connections
        const matchId = path.split('/').pop();
        const username = url.searchParams.get('username') || 'Anonymous';
        
        console.log('📝 Default remote game connection:', { matchId, username });
        handleSimpleRemoteGame(ws, request);
    });
    
    console.log('🔌 WebSocket server started on port 3001');
    return wss;
}