// Game types and interfaces
interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    speedX: number;
    speedY: number;
}

interface Paddle extends GameObject {
    score: number;
    color: string;
}

interface Ball extends GameObject {
    radius: number;
}

interface PowerUp extends GameObject {
    type: 'speed' | 'size' | 'multi';
    active: boolean;
    duration: number;
}

// Game state
class PowerpuffPong {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameRunning: boolean = false;
    private gameStarted: boolean = false;
    
    // Player information
    private player1Name: string = 'Blossom';
    private player2Name: string = 'Bubbles';
    
    // Game objects
    private ball!: Ball;
    private leftPaddle!: Paddle;
    private rightPaddle!: Paddle;
    private powerUps: PowerUp[] = [];
    
    // Game settings
    private readonly PADDLE_WIDTH = 15;
    private readonly PADDLE_HEIGHT = 100;
    private readonly BALL_RADIUS = 10;
    private readonly POWER_UP_SIZE = 20;
    
    // Input handling
    private keys: { [key: string]: boolean } = {};
    
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    private initializeGame(): void {
        // Initialize ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: this.BALL_RADIUS * 2,
            height: this.BALL_RADIUS * 2,
            radius: this.BALL_RADIUS,
            speedX: 5,
            speedY: 3
        };
        
        // Initialize paddles
        this.leftPaddle = {
            x: 50,
            y: this.canvas.height / 2 - this.PADDLE_HEIGHT / 2,
            width: this.PADDLE_WIDTH,
            height: this.PADDLE_HEIGHT,
            speedX: 0,
            speedY: 8,
            score: 0,
            color: '#FF69B4' // Powerpuff pink (Blossom)
        };
        
        this.rightPaddle = {
            x: this.canvas.width - 50 - this.PADDLE_WIDTH,
            y: this.canvas.height / 2 - this.PADDLE_HEIGHT / 2,
            width: this.PADDLE_WIDTH,
            height: this.PADDLE_HEIGHT,
            speedX: 0,
            speedY: 8,
            score: 0,
            color: '#87CEEB' // Powerpuff blue (Bubbles)
        };
        
        this.powerUps = [];
    }
    
    private setupEventListeners(): void {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for game keys
            if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            this.keys[e.key] = true;
            
            // Space bar for power-ups
            if (e.key === ' ' && this.gameRunning) {
                this.activatePowerUp();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Start button (in-game)
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startGame();
            });
        }
    }
    
    public startGame(): void {
        this.gameRunning = true;
        this.initializeGame();
        
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        
        this.gameLoop();
    }
    
    public showWelcomeScreen(): void {
        const overlay = document.getElementById('gameOverlay');
        const message = document.getElementById('gameMessage');
        
        if (overlay && message) {
            overlay.classList.remove('hidden');
            message.textContent = 'Welcome to Powerpuff Pong!';
        }
    }
    
    private gameLoop(): void {
        if (!this.gameRunning) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    private update(): void {
        this.updatePaddles();
        this.updateBall();
        this.updatePowerUps();
        this.checkCollisions();
        this.checkScore();
    }
    
    private updatePaddles(): void {
        // Left paddle (Blossom) - W/S keys
        if (this.keys['w'] || this.keys['W']) {
            this.leftPaddle.y = Math.max(0, this.leftPaddle.y - this.leftPaddle.speedY);
        }
        if (this.keys['s'] || this.keys['S']) {
            this.leftPaddle.y = Math.min(this.canvas.height - this.leftPaddle.height, 
                                       this.leftPaddle.y + this.leftPaddle.speedY);
        }
        
        // Right paddle (Bubbles) - Arrow keys
        if (this.keys['ArrowUp']) {
            this.rightPaddle.y = Math.max(0, this.rightPaddle.y - this.rightPaddle.speedY);
        }
        if (this.keys['ArrowDown']) {
            this.rightPaddle.y = Math.min(this.canvas.height - this.rightPaddle.height, 
                                        this.rightPaddle.y + this.rightPaddle.speedY);
        }
    }
    
    private updateBall(): void {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        
        // Ball hits top or bottom
        if (this.ball.y <= this.ball.radius || this.ball.y >= this.canvas.height - this.ball.radius) {
            this.ball.speedY = -this.ball.speedY;
        }
    }
    
    private updatePowerUps(): void {
        // Randomly spawn power-ups
        if (Math.random() < 0.005 && this.powerUps.length < 2) {
            this.spawnPowerUp();
        }
        
        // Update existing power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.duration--;
            return powerUp.duration > 0;
        });
    }
    
    private spawnPowerUp(): void {
        const types: ('speed' | 'size' | 'multi')[] = ['speed', 'size', 'multi'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const powerUp: PowerUp = {
            x: Math.random() * (this.canvas.width - this.POWER_UP_SIZE),
            y: Math.random() * (this.canvas.height - this.POWER_UP_SIZE),
            width: this.POWER_UP_SIZE,
            height: this.POWER_UP_SIZE,
            speedX: 0,
            speedY: 0,
            type,
            active: false,
            duration: 300 // 5 seconds at 60fps
        };
        
        this.powerUps.push(powerUp);
    }
    
    private activatePowerUp(): void {
        if (this.powerUps.length > 0) {
            const powerUp = this.powerUps[0];
            powerUp.active = true;
            
            switch (powerUp.type) {
                case 'speed':
                    this.ball.speedX *= 1.5;
                    this.ball.speedY *= 1.5;
                    break;
                case 'size':
                    this.ball.radius *= 1.5;
                    break;
                case 'multi':
                    // Create multiple balls (simplified)
                    this.ball.speedX *= 1.2;
                    break;
            }
            
            this.powerUps.shift();
        }
    }
    
    private checkCollisions(): void {
        // Ball collision with paddles
        if (this.ball.x <= this.leftPaddle.x + this.leftPaddle.width &&
            this.ball.y >= this.leftPaddle.y &&
            this.ball.y <= this.leftPaddle.y + this.leftPaddle.height &&
            this.ball.x >= this.leftPaddle.x) {
            this.ball.speedX = Math.abs(this.ball.speedX);
            this.addSpin();
        }
        
        if (this.ball.x + this.ball.width >= this.rightPaddle.x &&
            this.ball.y >= this.rightPaddle.y &&
            this.ball.y <= this.rightPaddle.y + this.rightPaddle.height &&
            this.ball.x <= this.rightPaddle.x + this.rightPaddle.width) {
            this.ball.speedX = -Math.abs(this.ball.speedX);
            this.addSpin();
        }
        
        // Ball collision with power-ups
        this.powerUps.forEach((powerUp, index) => {
            if (
                this.ball.x < powerUp.x + powerUp.width &&
                this.ball.x + this.ball.width > powerUp.x &&
                this.ball.y < powerUp.y + powerUp.height &&
                this.ball.y + this.ball.height > powerUp.y
            ) {
                // Determine which side the power-up is on
                const isLeftSide = powerUp.x < this.canvas.width / 2;
                if (isLeftSide) {
                    this.rightPaddle.score++;
                } else {
                    this.leftPaddle.score++;
                }
                this.updateScoreDisplay();
                this.powerUps.splice(index, 1);
            }
        });
    }
    
    private addSpin(): void {
        // Add some randomness to ball direction
        const spin = (Math.random() - 0.5) * 2;
        this.ball.speedY += spin;
        
        // Limit vertical speed
        this.ball.speedY = Math.max(-8, Math.min(8, this.ball.speedY));
    }
    
    private checkScore(): void {
        // Ball goes past left paddle (Bubbles scores)
        if (this.ball.x <= 0) {
            this.rightPaddle.score++;
            this.updateScoreDisplay();
            this.resetBall();
        }
        
        // Ball goes past right paddle (Blossom scores)
        if (this.ball.x >= this.canvas.width) {
            this.leftPaddle.score++;
            this.updateScoreDisplay();
            this.resetBall();
        }
        
        // Check for game end
        if (this.leftPaddle.score >= 11 || this.rightPaddle.score >= 11) {
            this.endGame();
        }
    }
    
    private resetBall(): void {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.speedY = (Math.random() - 0.5) * 6;
        this.ball.radius = this.BALL_RADIUS; // Reset size
    }
    
    private updateScoreDisplay(): void {
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        
        if (player1Score) player1Score.textContent = this.leftPaddle.score.toString();
        if (player2Score) player2Score.textContent = this.rightPaddle.score.toString();
    }
    
    private endGame(): void {
        this.gameRunning = false;
        
        const overlay = document.getElementById('gameOverlay');
        const message = document.getElementById('gameMessage');
        
        if (overlay && message) {
            overlay.classList.remove('hidden');
            const winner = this.leftPaddle.score >= 11 ? this.player1Name : this.player2Name;
            message.textContent = `${winner} wins! 💖`;
        }
    }
    
    private draw(): void {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw center line
        this.ctx.strokeStyle = '#DDA0DD';
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw paddles
        this.drawPaddle(this.leftPaddle);
        this.drawPaddle(this.rightPaddle);
        
        // Draw ball
        this.drawBall();
        
        // Draw power-ups
        this.drawPowerUps();
        
        // Draw decorative elements
        this.drawDecorations();
    }
    
    private drawPaddle(paddle: Paddle): void {
        // Gradient effect
        const gradient = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
        gradient.addColorStop(0, paddle.color);
        gradient.addColorStop(1, this.lightenColor(paddle.color, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Add shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height / 3);
    }
    
    private drawBall(): void {
        // Create gradient for ball
        const gradient = this.ctx.createRadialGradient(
            this.ball.x, this.ball.y, 0,
            this.ball.x, this.ball.y, this.ball.radius
        );
        gradient.addColorStop(0, '#FFD700'); // Gold center
        gradient.addColorStop(1, '#FFA500'); // Orange edge
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - this.ball.radius / 3, this.ball.y - this.ball.radius / 3, 
                     this.ball.radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    private drawPowerUps(): void {
        this.powerUps.forEach(powerUp => {
            let color: string;
            switch (powerUp.type) {
                case 'speed':
                    color = '#FF69B4'; // Pink
                    break;
                case 'size':
                    color = '#87CEEB'; // Blue
                    break;
                case 'multi':
                    color = '#98FB98'; // Green
                    break;
                default:
                    color = '#DDA0DD';
            }
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            // Add sparkle effect
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.fillRect(powerUp.x + 2, powerUp.y + 2, 4, 4);
        });
    }
    
    private drawDecorations(): void {
        // Draw some floating hearts and stars
        this.ctx.fillStyle = 'rgba(255, 105, 180, 0.3)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 150) % this.canvas.width;
            const y = (Math.sin(Date.now() * 0.001 + i) * 50) + 100;
            this.drawHeart(x, y, 10);
        }
    }
    
    private drawHeart(x: number, y: number, size: number): void {
        this.ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size / 4);
        this.ctx.quadraticCurveTo(x, y, x - size / 4, y);
        this.ctx.quadraticCurveTo(x - size / 2, y, x - size / 2, y + size / 4);
        this.ctx.quadraticCurveTo(x - size / 2, y + size / 2, x, y + size);
        this.ctx.quadraticCurveTo(x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        this.ctx.quadraticCurveTo(x + size / 2, y, x + size / 4, y);
        this.ctx.quadraticCurveTo(x, y, x, y + size / 4);
        this.ctx.fill();
    }
    
    private lightenColor(color: string, factor: number): string {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.floor(255 * factor));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.floor(255 * factor));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.floor(255 * factor));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// --- Navigation and App State ---
class AppNavigation {
    private sections: Record<string, HTMLElement> = {};
    private navLinks: Record<string, HTMLElement> = {};
    private currentSection: string = 'homeSection';
    private profileManager: ProfileManager;
    private gameInstance: PowerpuffPong | null = null;

    constructor(profileManager: ProfileManager) {
        this.profileManager = profileManager;
        this.sections = {
            homeSection: document.getElementById('homeSection')!,
            profileSection: document.getElementById('profileSection')!,
            inviteSection: document.getElementById('inviteSection')!,
            gameSection: document.getElementById('gameSection')!,
        };
        this.navLinks = {
            navHome: document.getElementById('navHome')!,
            navRegister: document.getElementById('navRegister')!,
            navProfile: document.getElementById('navProfile')!,
            navInvite: document.getElementById('navInvite')!,
        };
        this.setupNavEvents();
        this.showSection('homeSection');
    }

    isRegistered() {
        return true; // No registration required anymore
    }

    setupNavEvents() {
        this.navLinks.navHome.addEventListener('click', (e) => { e.preventDefault(); this.showSection('homeSection'); });
        this.navLinks.navRegister.addEventListener('click', (e) => { 
            e.preventDefault(); 
            this.showSection('gameSection');
            // Initialize the game when shown
            if (!this.gameInstance) {
                this.gameInstance = new PowerpuffPong();
                // Show the welcome overlay
                this.gameInstance.showWelcomeScreen();
            }
        });
        this.navLinks.navProfile.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('profileSection');
        });
        this.navLinks.navInvite.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('inviteSection');
        });
        // Play button on home
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.addEventListener('click', () => {
            this.showSection('gameSection');
            // Initialize the game when shown
            if (!this.gameInstance) {
                this.gameInstance = new PowerpuffPong();
                // Show the welcome overlay
                this.gameInstance.showWelcomeScreen();
            }
        });
    }

    showSection(sectionId: string) {
        Object.values(this.sections).forEach(sec => sec.classList.add('hidden'));
        this.sections[sectionId].classList.remove('hidden');
        this.currentSection = sectionId;
    }
}

// --- Profile and Registration ---
class ProfileManager {
    private name: string = 'Player';
    private email: string = '';
    private avatar: string = 'avatars/Blossom.jpg';
    private games: number = 0;
    private wins: number = 0;

    constructor() {
        this.loadProfile();
        this.updateProfileUI();
    }

    loadProfile() {
        const data = localStorage.getItem('ppg_profile');
        if (data) {
            const obj = JSON.parse(data);
            this.name = obj.name || 'Player';
            this.email = obj.email || '';
            this.avatar = obj.avatar || 'avatars/Blossom.jpg';
            this.games = obj.games || 0;
            this.wins = obj.wins || 0;
        }
    }

    saveProfile() {
        localStorage.setItem('ppg_profile', JSON.stringify({
            name: this.name,
            email: this.email,
            avatar: this.avatar,
            games: this.games,
            wins: this.wins,
        }));
    }

    updateProfileUI() {
        const nameEl = document.getElementById('profileName');
        const emailEl = document.getElementById('profileEmail');
        const avatarEl = document.getElementById('profileAvatar') as HTMLImageElement;
        const gamesEl = document.getElementById('profileGames');
        const winsEl = document.getElementById('profileWins');
        if (nameEl) nameEl.textContent = this.name;
        if (emailEl) emailEl.textContent = this.email;
        if (avatarEl) avatarEl.src = this.avatar || 'avatars/Blossom.jpg';
        if (gamesEl) gamesEl.textContent = this.games.toString();
        if (winsEl) winsEl.textContent = this.wins.toString();
    }

    addGame(win: boolean) {
        this.games++;
        if (win) this.wins++;
        this.saveProfile();
        this.updateProfileUI();
    }

    getName() { return this.name; }
    getAvatar() { return this.avatar; }
}

// --- Invite Logic ---
function setupInvite() {
    const inviteBtn = document.getElementById('copyInviteBtn');
    const inviteInput = document.getElementById('inviteLink') as HTMLInputElement;
    const inviteCopied = document.getElementById('inviteCopied');
    if (inviteBtn && inviteInput && inviteCopied) {
        inviteBtn.addEventListener('click', () => {
            inviteInput.select();
            document.execCommand('copy');
            inviteCopied.classList.remove('hidden');
            setTimeout(() => inviteCopied.classList.add('hidden'), 1500);
        });
    }
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const profile = new ProfileManager();
    setupInvite();
    new AppNavigation(profile);
    // Do NOT initialize PowerpuffPong here; only do it when gameSection is shown
}); 