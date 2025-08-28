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
    private authService: AuthService;

    constructor(profileManager: ProfileManager, authService: AuthService) {
        this.profileManager = profileManager;
        this.authService = authService;
        
        console.log('AppNavigation constructor - looking for DOM elements...');
        
        this.sections = {
            homeSection: document.getElementById('homeSection')!,
            authSection: document.getElementById('authSection')!,
            friendsSection: document.getElementById('friendsSection')!,
            tournamentsSection: document.getElementById('tournamentsSection')!,
            profileSection: document.getElementById('profileSection')!,
            inviteSection: document.getElementById('inviteSection')!,
            gameSection: document.getElementById('gameSection')!,
        };
        
        this.navLinks = {
            navHome: document.getElementById('navHome')!,
            navAuth: document.getElementById('navAuth')!,
            navFriends: document.getElementById('navFriends')!,
            navTournaments: document.getElementById('navTournaments')!,
            navRegister: document.getElementById('navRegister')!,
            navProfile: document.getElementById('navProfile')!,
            navInvite: document.getElementById('navInvite')!,
        };
        
        console.log('Sections found:', Object.keys(this.sections));
        console.log('Nav links found:', Object.keys(this.navLinks));
        
        this.setupNavEvents();
        // Start with auth section if not registered, home if registered
        if (this.isRegistered()) {
            this.showSection('homeSection');
        } else {
            this.showSection('authSection');
        }
        this.updateNavigationVisibility();
    }

    isRegistered() {
        return this.authService && this.authService.isAuthenticated ? this.authService.isAuthenticated() : false;
    }

    setupNavEvents() {
        console.log('Setting up navigation events');
        console.log('Navigation links:', this.navLinks);
        
        this.navLinks.navHome.addEventListener('click', (e) => { 
            e.preventDefault(); 
            console.log('Home clicked');
            this.showSection('homeSection'); 
        });
        this.navLinks.navAuth.addEventListener('click', (e) => { 
            e.preventDefault(); 
            console.log('Auth clicked');
            this.showSection('authSection'); 
        });
        this.navLinks.navFriends.addEventListener('click', (e) => { 
            e.preventDefault(); 
            console.log('Friends clicked');
            this.showSection('friendsSection'); 
        });
        this.navLinks.navTournaments.addEventListener('click', (e) => { 
            e.preventDefault(); 
            console.log('Tournaments clicked');
            this.showSection('tournamentsSection'); 
        });
        this.navLinks.navRegister.addEventListener('click', (e) => { 
            e.preventDefault(); 
            if (this.isRegistered()) {
                this.showSection('gameSection');
                // Initialize the game when shown
                if (!this.gameInstance) {
                    this.gameInstance = new PowerpuffPong();
                    // Show the welcome overlay
                    this.gameInstance.showWelcomeScreen();
                }
            } else {
                this.showSection('authSection');
            }
        });
        this.navLinks.navProfile.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.isRegistered()) {
                this.showSection('profileSection');
            } else {
                this.showSection('authSection');
            }
        });
        this.navLinks.navInvite.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.isRegistered()) {
                this.showSection('inviteSection');
            } else {
                this.showSection('authSection');
            }
        });
        // Play button on home
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.addEventListener('click', () => {
            if (this.isRegistered()) {
                this.showSection('gameSection');
                // Initialize the game when shown
                if (!this.gameInstance) {
                    this.gameInstance = new PowerpuffPong();
                    // Show the welcome overlay
                    this.gameInstance.showWelcomeScreen();
                }
            } else {
                this.showSection('authSection');
            }
        });
        
        // Also redirect home section to auth if not registered
        if (!this.isRegistered()) {
            this.showSection('authSection');
        }
    }

    updateNavigationVisibility() {
        const isAuthenticated = this.isRegistered();
        
        // Show/hide navigation items based on authentication
        if (this.navLinks.navAuth) {
            this.navLinks.navAuth.style.display = isAuthenticated ? 'none' : 'inline';
        }
        if (this.navLinks.navFriends) {
            this.navLinks.navFriends.style.display = isAuthenticated ? 'inline' : 'none';
        }
        if (this.navLinks.navTournaments) {
            this.navLinks.navTournaments.style.display = isAuthenticated ? 'inline' : 'none';
        }
        if (this.navLinks.navProfile) {
            this.navLinks.navProfile.style.display = isAuthenticated ? 'inline' : 'none';
        }
        if (this.navLinks.navInvite) {
            this.navLinks.navInvite.style.display = isAuthenticated ? 'inline' : 'none';
        }
    }

    showSection(sectionId: string) {
        console.log('Showing section:', sectionId);
        console.log('Available sections:', Object.keys(this.sections));
        
        Object.values(this.sections).forEach(sec => sec.classList.add('hidden'));
        
        if (this.sections[sectionId]) {
            this.sections[sectionId].classList.remove('hidden');
            this.currentSection = sectionId;
            console.log('Section shown successfully');
        } else {
            console.error('Section not found:', sectionId);
        }
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
        try {
            this.loadProfile();
            // Only update UI if DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.updateProfileUI();
                });
            } else {
                this.updateProfileUI();
            }
        } catch (error) {
            console.warn('ProfileManager initialization failed:', error);
        }
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
        try {
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
        } catch (error) {
            console.warn('Profile UI update failed:', error);
        }
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

// --- API Service Classes ---
class AuthService {
    private baseUrl: string = 'http://localhost:3000';
    private token: string | null = null;
    public onAuthChange: (() => void) | null = null;

    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async register(username: string, email: string, password: string): Promise<any> {
        return this.makeRequest('/auth/registerUser', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async login(email: string, password: string): Promise<any> {
        const response = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('auth_token', response.token);
            if (this.onAuthChange) this.onAuthChange();
        }
        
        return response;
    }

    async getCurrentUser(): Promise<any> {
        return this.makeRequest('/auth/me');
    }

    async logout(): Promise<void> {
        try {
            await this.makeRequest('/auth/logout', { method: 'POST' });
        } finally {
            this.token = null;
            localStorage.removeItem('auth_token');
            if (this.onAuthChange) this.onAuthChange();
        }
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    getToken(): string | null {
        return this.token;
    }
}

class FriendsService {
    private baseUrl: string = 'http://localhost:3000';
    private authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.authService.getToken();
        
        if (!token) {
            throw new Error('Authentication required');
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Friends API request failed:', error);
            throw error;
        }
    }

    async getFriends(): Promise<any> {
        return this.makeRequest('/friends');
    }

    async sendFriendRequest(username: string): Promise<any> {
        return this.makeRequest('/friends/sendRequest', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    async acceptFriendRequest(username: string): Promise<any> {
        return this.makeRequest('/friends/acceptRequest', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    async declineFriendRequest(username: string): Promise<any> {
        return this.makeRequest('/friends/declineRequest', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    async removeFriend(username: string): Promise<any> {
        return this.makeRequest('/friends/removeFriend', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    async blockFriend(username: string): Promise<any> {
        return this.makeRequest('/friends/blockFriend', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }
}

class TournamentService {
    private baseUrl: string = 'http://localhost:3000';
    private authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.authService.getToken();
        
        if (!token) {
            throw new Error('Authentication required');
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Tournament API request failed:', error);
            throw error;
        }
    }

    async createTournament(name: string, maxPlayers: number): Promise<any> {
        return this.makeRequest('/tournament/create', {
            method: 'POST',
            body: JSON.stringify({ name, maxPlayers })
        });
    }

    async getTournaments(): Promise<any> {
        return this.makeRequest('/tournament');
    }

    async joinTournament(tournamentId: string): Promise<any> {
        return this.makeRequest('/tournament/join', {
            method: 'POST',
            body: JSON.stringify({ tournamentId })
        });
    }

    async getNextMatch(): Promise<any> {
        return this.makeRequest('/tournament/next-match');
    }

    async resetTournament(): Promise<any> {
        return this.makeRequest('/tournament/reset', {
            method: 'POST'
        });
    }
}

// --- UI Management Classes ---
class AuthUI {
    private authService: AuthService;
    private loginForm: HTMLElement;
    private registerForm: HTMLElement;
    private userInfo: HTMLElement;
    private statusElement: HTMLElement;

    constructor(authService: AuthService) {
        this.authService = authService;
        this.loginForm = document.getElementById('loginForm')!;
        this.registerForm = document.getElementById('registerForm')!;
        this.userInfo = document.getElementById('userInfo')!;
        this.statusElement = document.getElementById('authStatus')!;
        
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    private setupEventListeners(): void {
        // Show/hide form toggles
        document.getElementById('showRegisterForm')?.addEventListener('click', () => {
            this.loginForm.classList.add('hidden');
            this.registerForm.classList.remove('hidden');
        });

        document.getElementById('showLoginForm')?.addEventListener('click', () => {
            this.registerForm.classList.add('hidden');
            this.loginForm.classList.remove('hidden');
        });

        // Form submissions
        document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });
    }

    private async handleLogin(): Promise<void> {
        const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
        const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

        try {
            await this.authService.login(email, password);
            this.showStatus('Login successful!', 'success');
            this.checkAuthStatus();
        } catch (error) {
            this.showStatus('Login failed: ' + (error as Error).message, 'error');
        }
    }

    private async handleRegister(): Promise<void> {
        const username = (document.getElementById('registerUsername') as HTMLInputElement).value;
        const email = (document.getElementById('registerEmail') as HTMLInputElement).value;
        const password = (document.getElementById('registerPassword') as HTMLInputElement).value;

        try {
            await this.authService.register(username, email, password);
            this.showStatus('Registration successful! Please login.', 'success');
            // Switch to login form
            this.registerForm.classList.add('hidden');
            this.loginForm.classList.remove('hidden');
        } catch (error) {
            this.showStatus('Registration failed: ' + (error as Error).message, 'error');
        }
    }

    private async handleLogout(): Promise<void> {
        try {
            await this.authService.logout();
            this.showStatus('Logout successful!', 'success');
            this.checkAuthStatus();
        } catch (error) {
            this.showStatus('Logout failed: ' + (error as Error).message, 'error');
        }
    }

    private async checkAuthStatus(): Promise<void> {
        if (this.authService.isAuthenticated()) {
            try {
                const user = await this.authService.getCurrentUser();
                this.showUserInfo(user);
            } catch (error) {
                // Token might be invalid, clear it
                this.authService.logout();
                this.showLoginForm();
            }
        } else {
            this.showLoginForm();
        }
    }

    private showUserInfo(user: any): void {
        this.loginForm.classList.add('hidden');
        this.registerForm.classList.add('hidden');
        this.userInfo.classList.remove('hidden');
        
        const nameElement = document.getElementById('userDisplayName');
        const emailElement = document.getElementById('userDisplayEmail');
        
        if (nameElement) nameElement.textContent = user.username || user.name || 'User';
        if (emailElement) emailElement.textContent = user.email || 'user@example.com';
    }

    private showLoginForm(): void {
        this.userInfo.classList.add('hidden');
        this.registerForm.classList.add('hidden');
        this.loginForm.classList.remove('hidden');
    }

    private showStatus(message: string, type: 'success' | 'error'): void {
        this.statusElement.textContent = message;
        this.statusElement.className = `mt-4 text-center p-2 rounded ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
        this.statusElement.classList.remove('hidden');
        
        setTimeout(() => {
            this.statusElement.classList.add('hidden');
        }, 5000);
    }
}

class FriendsUI {
    private friendsService: FriendsService;
    private friendsList: HTMLElement;
    private friendRequests: HTMLElement;
    private statusElement: HTMLElement;

    constructor(friendsService: FriendsService) {
        this.friendsService = friendsService;
        this.friendsList = document.getElementById('friendsList')!;
        this.friendRequests = document.getElementById('friendRequests')!;
        this.statusElement = document.getElementById('friendsStatus')!;
        
        this.setupEventListeners();
        this.loadFriends();
    }

    private setupEventListeners(): void {
        document.getElementById('addFriendForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddFriend();
        });
    }

    private async handleAddFriend(): Promise<void> {
        const username = (document.getElementById('friendUsername') as HTMLInputElement).value;
        
        try {
            await this.friendsService.sendFriendRequest(username);
            this.showStatus('Friend request sent!', 'success');
            (document.getElementById('friendUsername') as HTMLInputElement).value = '';
            this.loadFriends();
        } catch (error) {
            this.showStatus('Failed to send friend request: ' + (error as Error).message, 'error');
        }
    }

    private async loadFriends(): Promise<void> {
        try {
            const friends = await this.friendsService.getFriends();
            this.renderFriends(friends);
        } catch (error) {
            this.showStatus('Failed to load friends: ' + (error as Error).message, 'error');
        }
    }

    private renderFriends(friends: any): void {
        // This is a simplified render - you might want to enhance this based on your backend response structure
        if (friends && friends.length > 0) {
            this.friendsList.innerHTML = friends.map((friend: any) => `
                <div class="flex items-center justify-between p-2 bg-white bg-opacity-20 rounded">
                    <span class="text-white">${friend.username || friend.name}</span>
                    <button onclick="removeFriend('${friend.username || friend.name}')" 
                            class="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-sm">
                        Remove
                    </button>
                </div>
            `).join('');
        } else {
            this.friendsList.innerHTML = '<p class="text-white text-center">No friends yet</p>';
        }
    }

    private showStatus(message: string, type: 'success' | 'error'): void {
        this.statusElement.textContent = message;
        this.statusElement.className = `mt-4 text-center p-2 rounded ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
        this.statusElement.classList.remove('hidden');
        
        setTimeout(() => {
            this.statusElement.classList.add('hidden');
        }, 5000);
    }
}

class TournamentUI {
    private tournamentService: TournamentService;
    private activeTournaments: HTMLElement;
    private statusElement: HTMLElement;

    constructor(tournamentService: TournamentService) {
        this.tournamentService = tournamentService;
        this.activeTournaments = document.getElementById('activeTournaments')!;
        this.statusElement = document.getElementById('tournamentsStatus')!;
        
        this.setupEventListeners();
        this.loadTournaments();
    }

    private setupEventListeners(): void {
        document.getElementById('createTournamentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateTournament();
        });

        document.getElementById('joinTournamentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleJoinTournament();
        });
    }

    private async handleCreateTournament(): Promise<void> {
        const name = (document.getElementById('tournamentName') as HTMLInputElement).value;
        const maxPlayers = parseInt((document.getElementById('maxPlayers') as HTMLInputElement).value);
        
        try {
            await this.tournamentService.createTournament(name, maxPlayers);
            this.showStatus('Tournament created successfully!', 'success');
            (document.getElementById('tournamentName') as HTMLInputElement).value = '';
            this.loadTournaments();
        } catch (error) {
            this.showStatus('Failed to create tournament: ' + (error as Error).message, 'error');
        }
    }

    private async handleJoinTournament(): Promise<void> {
        const tournamentId = (document.getElementById('tournamentId') as HTMLInputElement).value;
        
        try {
            await this.tournamentService.joinTournament(tournamentId);
            this.showStatus('Joined tournament successfully!', 'success');
            (document.getElementById('tournamentId') as HTMLInputElement).value = '';
            this.loadTournaments();
        } catch (error) {
            this.showStatus('Failed to join tournament: ' + (error as Error).message, 'error');
        }
    }

    private async loadTournaments(): Promise<void> {
        try {
            const tournaments = await this.tournamentService.getTournaments();
            this.renderTournaments(tournaments);
        } catch (error) {
            this.showStatus('Failed to load tournaments: ' + (error as Error).message, 'error');
        }
    }

    private renderTournaments(tournaments: any): void {
        // This is a simplified render - you might want to enhance this based on your backend response structure
        if (tournaments && tournaments.length > 0) {
            this.activeTournaments.innerHTML = tournaments.map((tournament: any) => `
                <div class="bg-white bg-opacity-20 rounded-lg p-4">
                    <h4 class="text-lg font-bold text-white mb-2">${tournament.name || 'Tournament'}</h4>
                    <p class="text-white text-sm">Players: ${tournament.currentPlayers || 0}/${tournament.maxPlayers || 8}</p>
                    <p class="text-white text-sm">Status: ${tournament.status || 'Active'}</p>
                </div>
            `).join('');
        } else {
            this.activeTournaments.innerHTML = '<p class="text-white text-center">No active tournaments</p>';
        }
    }

    private showStatus(message: string, type: 'success' | 'error'): void {
        this.statusElement.textContent = message;
        this.statusElement.className = `mt-4 text-center p-2 rounded ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
        this.statusElement.classList.remove('hidden');
        
        setTimeout(() => {
            this.statusElement.classList.add('hidden');
        }, 5000);
    }
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

// Global function for removing friends (called from inline onclick)
function removeFriend(username: string) {
    // This will be implemented when we have access to the FriendsService instance
    console.log('Remove friend:', username);
    // You might want to implement this differently or pass the service instance
}

// Make it available globally
(window as any).removeFriend = removeFriend;

// --- App Initialization ---
console.log('Script loaded - waiting for DOM');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting app initialization');
    alert('JavaScript is running!');
    
    try {
        const profile = new ProfileManager();
        console.log('ProfileManager created');
        
        const authService = new AuthService();
        console.log('AuthService created');
        
        const friendsService = new FriendsService(authService);
        console.log('FriendsService created');
        
        const tournamentService = new TournamentService(authService);
        console.log('TournamentService created');
        
        // Initialize UI managers
        const authUI = new AuthUI(authService);
        console.log('AuthUI created');
        
        const friendsUI = new FriendsUI(friendsService);
        console.log('FriendsUI created');
        
        const tournamentUI = new TournamentUI(tournamentService);
        console.log('TournamentUI created');
        
        setupInvite();
        console.log('Invite setup complete');
        
        const appNavigation = new AppNavigation(profile, authService);
        console.log('AppNavigation created');
        
        // Update navigation when auth status changes
        authService.onAuthChange = () => {
            appNavigation.updateNavigationVisibility();
        };
        
        console.log('App initialization complete');
        
        // Do NOT initialize PowerpuffPong here; only do it when gameSection is shown
    } catch (error) {
        console.error('Error during app initialization:', error);
        alert('Error: ' + (error as Error).message);
    }
}); 