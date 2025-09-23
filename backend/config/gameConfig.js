/**
 * Game Configuration Constants
 * 
 * This file centralizes all game-related configuration values.
 * To modify game behavior, change values here and they will apply
 * to both backend and frontend automatically.
 * 
 * Benefits:
 * - Single source of truth for all game settings
 * - Easy to modify game difficulty, speed, and dimensions
 * - No more magic numbers scattered throughout the code
 * - Professional software engineering practices
 */

export const GAME_CONFIG = {
    // Canvas dimensions
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600
    },
    
    // Paddle properties
    PADDLE: {
        WIDTH: 15,
        HEIGHT: 100,
        SPEED: 8,
        COLOR: {
            PLAYER: '#60a5fa',  // Blue
            AI: '#f87171'        // Red
        }
    },
    
    // Ball properties
    BALL: {
        RADIUS: 10,
        SPEED_X: 5,
        SPEED_Y: 3,
        COLOR: '#facc15'  // Yellow
    },
    
    
    // Game rules and timing
    GAME: {
        WINNING_SCORE: 5,
        GAME_LOOP_INTERVAL: 16,    // 60 FPS (1000ms / 60)
        AI_UPDATE_INTERVAL: 50,    // AI updates every 50ms
        AI_TOLERANCE: 10,          // AI movement tolerance (default)
        BALL_SPEED_MULTIPLIER: 2   // Ball speed variation on paddle hits
    },
    
    // WebSocket configuration
    WEBSOCKET: {
        RECONNECT_ATTEMPTS: 3,
        RECONNECT_DELAY: 1000
    },
    
    // UI configuration
    UI: {
        COLORS: {
            BACKGROUND: '#1a1a2e',
            CONTAINER: '#16213e',
            BORDER: '#0f0f23',
            ACCENT: '#533483',
            TEXT_PRIMARY: '#ffffff',
            TEXT_SECONDARY: '#e94560'
        },
        FONTS: {
            PRIMARY: 'Courier New, monospace',
            SECONDARY: 'Arial, sans-serif'
        }
    }
};

// Validation function to ensure configuration is valid
export function validateGameConfig() {
    const errors = [];
    
    if (GAME_CONFIG.CANVAS.WIDTH <= 0) errors.push('Canvas width must be positive');
    if (GAME_CONFIG.CANVAS.HEIGHT <= 0) errors.push('Canvas height must be positive');
    if (GAME_CONFIG.PADDLE.WIDTH <= 0) errors.push('Paddle width must be positive');
    if (GAME_CONFIG.PADDLE.HEIGHT <= 0) errors.push('Paddle height must be positive');
    if (GAME_CONFIG.BALL.RADIUS <= 0) errors.push('Ball radius must be positive');
    if (GAME_CONFIG.GAME.WINNING_SCORE <= 0) errors.push('Winning score must be positive');
    
    
    if (errors.length > 0) {
        throw new Error(`Game configuration validation failed:\n${errors.join('\n')}`);
    }
    
    return true;
}

// Helper function to get canvas center coordinates
export function getCanvasCenter() {
    return {
        x: GAME_CONFIG.CANVAS.WIDTH / 2,
        y: GAME_CONFIG.CANVAS.HEIGHT / 2
    };
}

// Helper function to get paddle starting positions
export function getPaddleStartPositions() {
    const centerY = (GAME_CONFIG.CANVAS.HEIGHT - GAME_CONFIG.PADDLE.HEIGHT) / 2;
    return {
        player: centerY,
        ai: centerY
    };
}

// Helper function to check if position is within canvas bounds
export function isWithinCanvasBounds(x, y) {
    return x >= 0 && x <= GAME_CONFIG.CANVAS.WIDTH && 
           y >= 0 && y <= GAME_CONFIG.CANVAS.HEIGHT;
}

// Helper function to get paddle bounds for collision detection
export function getPaddleBounds(paddleY, isPlayer = true) {
    const x = isPlayer ? 0 : GAME_CONFIG.CANVAS.WIDTH - GAME_CONFIG.PADDLE.WIDTH;
    
    return {
        left: x,
        right: x + GAME_CONFIG.PADDLE.WIDTH,
        top: paddleY,
        bottom: paddleY + GAME_CONFIG.PADDLE.HEIGHT,
        center: paddleY + GAME_CONFIG.PADDLE.HEIGHT / 2
    };
}


export default GAME_CONFIG;
