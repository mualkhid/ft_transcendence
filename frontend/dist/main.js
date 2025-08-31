"use strict";
// Simple Authentication System
class SimpleAuth {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.init();
    }
    init() {
        console.log('SimpleAuth initializing...');
        this.checkAuthStatus();
        this.setupEventListeners();
        this.setupMainAppNavigation();
        this.setupGameOptions();
    }
    setupEventListeners() {
        // Form submissions
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Registration form submitted, calling handleRegistration');
                this.handleRegistration();
            });
            console.log('Registration form listener attached');
        }
        else {
            console.error('Registration form not found!');
        }
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
            console.log('Login form listener attached');
        }
        // Page navigation
        const showLoginBtn = document.getElementById('showLoginPage');
        console.log('Show login button element:', showLoginBtn);
        console.log('Show login button HTML:', showLoginBtn?.outerHTML);
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Login button clicked!');
                this.showPage('loginPage');
            });
            console.log('Show login button listener attached');
            // Test if the button is clickable
            console.log('Button clickable test:', showLoginBtn.onclick);
        }
        else {
            console.error('Show login button not found!');
            // Try to find it again with different selector
            const allButtons = document.querySelectorAll('button');
            console.log('All buttons found:', allButtons.length);
            allButtons.forEach((btn, index) => {
                if (btn.textContent?.includes('Login here')) {
                    console.log(`Found login button at index ${index}:`, btn);
                }
            });
        }
        const showRegBtn = document.getElementById('showRegistrationPage');
        if (showRegBtn) {
            showRegBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('registrationPage');
            });
            console.log('Show registration button listener attached');
        }
        // Password validation
        const passwordInput = document.getElementById('regPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.updatePasswordRequirements(e.target.value);
            });
            console.log('Password input listener attached');
        }
        // Main app navigation
        this.setupMainAppNavigation();
    }
    async handleRegistration() {
        const username = document.getElementById('regUsername')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        if (!username || !email || !password) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.showStatus('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                this.showStatus(data.error || 'Registration failed', 'error');
            }
        }
        catch (error) {
            console.error('Registration error:', error);
            this.showStatus('Registration failed. Please try again.', 'error');
        }
    }
    async handleLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        if (!email || !password) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.showStatus('Login successful! Redirecting to home...', 'success');
                setTimeout(() => {
                    this.showPage('mainApp');
                    this.showSection('homeSection');
                }, 2000);
            }
            else {
                this.showStatus(data.error || 'Login failed', 'error');
            }
        }
        catch (error) {
            console.error('Login error:', error);
            this.showStatus('Login failed. Please try again.', 'error');
        }
    }
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        if (token && user) {
            this.authToken = token;
            this.currentUser = JSON.parse(user);
            this.showPage('mainApp');
            this.showSection('homeSection');
        }
        else {
            this.showPage('registrationPage');
        }
    }
    async handleLogout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.showStatus('Logged out successfully', 'success');
        setTimeout(() => {
            this.showPage('registrationPage');
        }, 1000);
    }
    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `status ${type}`;
            statusDiv.style.display = 'block';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
    showPage(pageId) {
        console.log(`showPage called with: ${pageId}`);
        const pages = document.querySelectorAll('.page');
        console.log(`Found ${pages.length} pages:`, Array.from(pages).map(p => p.id));
        pages.forEach(page => {
            page.classList.remove('active');
            console.log(`Removed active class from page: ${page.id}`);
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log(`Added active class to page: ${pageId}`);
        }
        else {
            console.error(`Page not found: ${pageId}`);
        }
    }
    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`Showing section: ${sectionId}`);
        }
        else {
            console.error(`Section not found: ${sectionId}`);
        }
    }
    updatePasswordRequirements(password) {
        const requirements = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        // Update visual indicators
        Object.entries(requirements).forEach(([req, met]) => {
            const element = document.getElementById(`${req}Check`);
            if (element) {
                element.innerHTML = met ? '✅' : '❌';
                element.className = met ? 'text-green-500' : 'text-red-500';
            }
        });
    }
    setupMainAppNavigation() {
        const navHome = document.getElementById('navHome');
        const navFriends = document.getElementById('navFriends');
        const navProfile = document.getElementById('navProfile');
        const navLogout = document.getElementById('navLogout');
        const backToHome = document.getElementById('backToHome');
        
        if (navHome) {
            navHome.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('homeSection');
            });
        }
        if (navFriends) {
            navFriends.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('friendsSection');
            });
        }
        if (navProfile) {
            navProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('profileSection');
                this.loadProfileData();
            });
        }
        if (navLogout) {
            navLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        if (backToHome) {
            backToHome.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('homeSection');
            });
        }
        
        // Setup profile functionality
        this.setupProfileFunctionality();
    }
    setupGameOptions() {
        // Add click handlers for game options
        const gameOptions = document.querySelectorAll('[data-game-type]');
        console.log('Found game options:', gameOptions.length);
        gameOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const gameType = e.currentTarget.getAttribute('data-game-type');
                console.log('Game option clicked:', gameType);
                this.handleGameSelection(gameType || '1v1');
            });
        });
    }
    async handleGameSelection(gameType) {
        if (!this.authToken) {
            this.showStatus('Please log in to play games', 'error');
            return;
        }
        
        console.log(`Starting ${gameType} game...`);
        
        switch (gameType) {
            case '1v1':
                this.startLocalGame();
                break;
            case '1vAI':
                this.startAIGame();
                break;
            case 'online':
                this.startOnlineGame();
                break;
            case 'tournament':
                this.startTournament();
                break;
            default:
                this.showStatus('Unknown game type', 'error');
        }
    }
    
    startLocalGame() {
        this.showStatus('Starting 1v1 Local Game...', 'success');
        // Show the game section
        this.showSection('gameSection');
        
        // Initialize the local game
        this.initializeLocalGame();
    }
    
    startAIGame() {
        this.showStatus('Starting 1v1 AI Game...', 'success');
        // Show the game section
        this.showSection('gameSection');
        
        // Initialize the AI game
        this.initializeAIGame();
    }
    
    startOnlineGame() {
        this.showStatus('Looking for online players...', 'info');
        
        // Create online game request
        this.createOnlineGame();
    }
    
    startTournament() {
        this.showStatus('Joining tournament...', 'info');
        
        // Join or create tournament
        this.joinTournament();
    }
    
    initializeLocalGame() {
        // Initialize local 1v1 game
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            // Set up local game logic
            this.setupLocalGame(gameCanvas);
        }
    }
    
    initializeAIGame() {
        // Initialize AI game
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            // Set up AI game logic
            this.setupAIGame(gameCanvas);
        }
    }
    
    async createOnlineGame() {
        try {
            const response = await fetch('http://localhost:3000/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    gameType: 'online',
                    player1Id: this.currentUser.id
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showStatus('Online game created! Waiting for players...', 'success');
                // Handle online game setup
                this.handleOnlineGame(data);
            } else {
                const data = await response.json();
                this.showStatus(data.error || 'Failed to create online game', 'error');
            }
        } catch (error) {
            console.error('Online game creation error:', error);
            this.showStatus('Failed to create online game', 'error');
        }
    }
    
    async joinTournament() {
        try {
            const response = await fetch('http://localhost:3000/api/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    action: 'join',
                    playerId: this.currentUser.id
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showStatus('Tournament joined successfully!', 'success');
                // Handle tournament setup
                this.handleTournament(data);
            } else {
                const data = await response.json();
                this.showStatus(data.error || 'Failed to join tournament', 'error');
            }
        } catch (error) {
            console.error('Tournament join error:', error);
            this.showStatus('Failed to join tournament', 'error');
        }
    }
    
    setupLocalGame(canvas) {
        // Local 1v1 game implementation
        this.showStatus('Local game started! Use W/S for Player 1, Arrow keys for Player 2', 'info');
        
        // Game state
        this.gameState = {
            type: 'local',
            player1Score: 0,
            player2Score: 0,
            isActive: true
        };
        
        // Update player names AFTER setting game state
        this.updatePlayerNames();
        
        // Update score display
        this.updateGameScore();
        
        // Start countdown and then game
        this.startCountdown(canvas);
    }
    
    setupAIGame(canvas) {
        // AI game implementation
        this.showStatus('AI game started! Use W/S keys to play against the computer', 'info');
        
        // Game state
        this.gameState = {
            type: 'ai',
            playerScore: 0,
            aiScore: 0,
            isActive: true
        };
        
        // Update player names AFTER setting game state
        this.updatePlayerNames();
        
        // Update score display
        this.updateGameScore();
        
        // Start countdown and then game
        this.startCountdown(canvas, true);
    }
    
    updatePlayerNames() {
        const player1Name = document.getElementById('player1Name');
        const player2Name = document.getElementById('player2Name');
        
        if (player1Name) {
            player1Name.textContent = this.currentUser?.username || 'Player 1';
        }
        
        if (player2Name) {
            if (this.gameState?.type === 'ai') {
                player2Name.textContent = 'AI Opponent';
            } else {
                player2Name.textContent = 'Player 2';
            }
        }
    }
    
    updateGameScore() {
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        
        if (this.gameState.type === 'local') {
            if (player1Score) player1Score.textContent = this.gameState.player1Score;
            if (player2Score) player2Score.textContent = this.gameState.player2Score;
        } else if (this.gameState.type === 'ai') {
            if (player1Score) player1Score.textContent = this.gameState.playerScore;
            if (player2Score) player2Score.textContent = this.gameState.aiScore;
        }
    }
    
    startCountdown(canvas, isAI = false) {
        console.log('Starting countdown...');
        const gameMessage = document.getElementById('gameMessage');
        let countdown = 3;
        
        // Clear any existing intervals
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.countdownInterval = setInterval(() => {
            console.log(`Countdown: ${countdown}`);
            if (countdown > 0) {
                if (gameMessage) {
                    gameMessage.textContent = `Game starts in ${countdown}...`;
                }
                countdown--;
            } else {
                clearInterval(this.countdownInterval);
                if (gameMessage) {
                    gameMessage.textContent = 'GO!';
                }
                
                // Start the actual game after a short delay
                setTimeout(() => {
                    console.log('Starting game after countdown');
                    this.startGameLoop(canvas, isAI);
                }, 500);
            }
        }, 1000);
    }
    
    drawGame(ctx, canvasWidth, canvasHeight, leftPaddle, rightPaddle, ball) {
        // Draw beautiful background with hearts instead of plain black
        this.drawHeartsBackground(ctx, canvasWidth, canvasHeight);
        
        // Draw center line with Powerpuff Girls theme
        ctx.strokeStyle = '#ff69b4'; // Pink center line
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 20]);
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, 0);
        ctx.lineTo(canvasWidth / 2, canvasHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw paddles with Powerpuff Girls colors
        ctx.fillStyle = '#ff69b4'; // Pink for left paddle (Blossom)
        ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
        
        ctx.fillStyle = '#87ceeb'; // Blue for right paddle (Bubbles)
        ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
        
        // Draw ball with Powerpuff Girls theme
        ctx.fillStyle = '#ff1493'; // Deep pink ball
        ctx.beginPath();
        ctx.arc(ball.x + ball.size/2, ball.y + ball.size/2, ball.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect to ball
        ctx.shadowColor = '#ff69b4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ball.x + ball.size/2, ball.y + ball.size/2, ball.size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    drawHeartsBackground(ctx, canvasWidth, canvasHeight) {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, '#ff69b4'); // Pink
        gradient.addColorStop(0.5, '#87ceeb'); // Blue
        gradient.addColorStop(1, '#98fb98'); // Green
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw floating hearts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 37) % canvasWidth;
            const y = (i * 23) % canvasHeight;
            this.drawHeart(ctx, x, y, 8);
        }
        
        // Draw larger hearts in corners
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.drawHeart(ctx, 50, 50, 15);
        this.drawHeart(ctx, canvasWidth - 50, 50, 15);
        this.drawHeart(ctx, 50, canvasHeight - 50, 15);
        this.drawHeart(ctx, canvasWidth - 50, canvasHeight - 50, 15);
    }
    
    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
        ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.8, x, y + size * 0.8);
        ctx.bezierCurveTo(x, y + size * 0.8, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
        ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
        ctx.fill();
    }
    
    startGameLoop(canvas, isAI = false) {
        // Basic Pong game implementation
        console.log(`Game loop started for ${isAI ? 'AI' : 'local'} game`);
        
        // Game variables
        const ctx = canvas.getContext('2d');
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Paddle dimensions
        const paddleWidth = 15;
        const paddleHeight = 100;
        const paddleSpeed = 8;
        
        // Ball dimensions
        const ballSize = 15;
        
        // Game objects
        let ball = {
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            dx: 5,
            dy: 3,
            size: ballSize
        };
        
        let leftPaddle = {
            x: 50,
            y: canvasHeight / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            dy: 0
        };
        
        let rightPaddle = {
            x: canvasWidth - 50 - paddleWidth,
            y: canvasHeight / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            dy: 0
        };
        
        // Key states
        const keys = {};
        
        // Event listeners for keyboard
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
        
        // Reset ball function
        const resetBall = () => {
            ball.x = canvasWidth / 2;
            ball.y = canvasHeight / 2;
            ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
            ball.dy = (Math.random() > 0.5 ? 1 : -1) * 3;
        };
        
        // Game loop
        const gameLoop = () => {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // Handle input
            if (keys['w'] || keys['W']) {
                leftPaddle.dy = -paddleSpeed;
            } else if (keys['s'] || keys['S']) {
                leftPaddle.dy = paddleSpeed;
            } else {
                leftPaddle.dy = 0;
            }
            
            if (keys['ArrowUp']) {
                rightPaddle.dy = -paddleSpeed;
            } else if (keys['ArrowDown']) {
                rightPaddle.dy = paddleSpeed;
            } else {
                rightPaddle.dy = 0;
            }
            
            // Update paddle positions
            leftPaddle.y += leftPaddle.dy;
            rightPaddle.y += rightPaddle.dy;
            
            // Paddle boundaries
            leftPaddle.y = Math.max(0, Math.min(canvasHeight - paddleHeight, leftPaddle.y));
            rightPaddle.y = Math.max(0, Math.min(canvasHeight - paddleHeight, rightPaddle.y));
            
            // Update ball position
            ball.x += ball.dx;
            ball.y += ball.dy;
            
            // Ball boundaries
            if (ball.y <= 0 || ball.y >= canvasHeight - ballSize) {
                ball.dy = -ball.dy;
            }
            
            // Ball collision with paddles
            if (ball.x <= leftPaddle.x + paddleWidth && 
                ball.y >= leftPaddle.y && 
                ball.y <= leftPaddle.y + paddleHeight &&
                ball.dx < 0) {
                ball.dx = -ball.dx;
                ball.x = leftPaddle.x + paddleWidth;
            }
            
            if (ball.x + ballSize >= rightPaddle.x && 
                ball.y >= rightPaddle.y && 
                ball.y <= rightPaddle.y + paddleHeight &&
                ball.dx > 0) {
                ball.dx = -ball.dx;
                ball.x = rightPaddle.x - ballSize;
            }
            
            // Score points
            if (ball.x <= 0) {
                // Right player scores
                if (isAI) {
                    this.gameState.aiScore++;
                } else {
                    this.gameState.player2Score++;
                }
                this.updateGameScore();
                
                // Check if game should end
                if ((isAI && this.gameState.aiScore >= 11) || (!isAI && this.gameState.player2Score >= 11)) {
                    this.endGame(isAI ? 'AI' : 'Player 2');
                    return;
                }
                
                resetBall();
            } else if (ball.x >= canvasWidth) {
                // Left player scores
                if (isAI) {
                    this.gameState.playerScore++;
                } else {
                    this.gameState.player1Score++;
                }
                this.updateGameScore();
                
                // Check if game should end
                if ((isAI && this.gameState.playerScore >= 11) || (!isAI && this.gameState.player1Score >= 11)) {
                    this.endGame(isAI ? 'Player 1' : 'Player 1');
                    return;
                }
                
                resetBall();
            }
            
            // Draw everything
            this.drawGame(ctx, canvasWidth, canvasHeight, leftPaddle, rightPaddle, ball);
            
            // Continue game loop
            if (this.gameState.isActive) {
                requestAnimationFrame(gameLoop);
            }
        };
        
        // Start the game loop
        gameLoop();
        
        // Hide the start button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.style.display = 'none';
        }
    }
    
    handleOnlineGame(gameData) {
        this.showStatus(`Online game ${gameData.id} created!`, 'success');
        // Handle online game logic
        console.log('Online game data:', gameData);
    }
    handleTournament(tournamentData) {
        this.showStatus(`Tournament ${tournamentData.id} joined!`, 'success');
        // Handle tournament logic
        console.log('Tournament data:', tournamentData);
    }
    
    setupProfileFunctionality() {
        // Username change
        const changeUsernameBtn = document.getElementById('changeUsernameBtn');
        if (changeUsernameBtn) {
            changeUsernameBtn.addEventListener('click', () => {
                this.handleUsernameChange();
            });
        }
        
        // Email change
        const changeEmailBtn = document.getElementById('changeEmailBtn');
        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', () => {
                this.handleEmailChange();
            });
        }
        
        // 2FA toggle
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', () => {
                this.handle2FAToggle();
            });
        }
        
        // Availability toggle
        const availabilityToggle = document.getElementById('availabilityToggle');
        if (availabilityToggle) {
            availabilityToggle.addEventListener('change', () => {
                this.handleAvailabilityToggle();
            });
        }
        
        // Avatar upload
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }
    }
    
    async handleUsernameChange() {
        const newUsername = document.getElementById('newUsername')?.value;
        if (!newUsername) {
            this.showStatus('Please enter a new username', 'error');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ username: newUsername })
            });
            
            if (response.ok) {
                this.showStatus('Username updated successfully!', 'success');
                this.currentUser.username = newUsername;
                this.updateProfileDisplay();
                document.getElementById('newUsername').value = '';
            } else {
                const data = await response.json();
                this.showStatus(data.error || 'Failed to update username', 'error');
            }
        } catch (error) {
            console.error('Username update error:', error);
            this.showStatus('Failed to update username', 'error');
        }
    }
    
    async handleEmailChange() {
        const newEmail = document.getElementById('newEmail')?.value;
        if (!newEmail) {
            this.showStatus('Please enter a new email', 'error');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ email: newEmail })
            });
            
            if (response.ok) {
                this.showStatus('Email updated successfully!', 'success');
                this.currentUser.email = newEmail;
                this.updateProfileDisplay();
                document.getElementById('newEmail').value = '';
            } else {
                const data = await response.json();
                this.showStatus(data.error || 'Failed to update email', 'error');
            }
        } catch (error) {
            console.error('Email update error:', error);
            this.showStatus('Failed to update email', 'error');
        }
    }
    
    async handle2FAToggle() {
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        const isEnabled = twoFactorToggle?.checked;
        
        try {
            const response = await fetch('http://localhost:3000/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ two_factor_enabled: isEnabled })
            });
            
            if (response.ok) {
                this.showStatus(`2FA ${isEnabled ? 'enabled' : 'disabled'} successfully!`, 'success');
                this.currentUser.two_factor_enabled = isEnabled;
            } else {
                const data = await response.json();
                this.showStatus(data.error || 'Failed to update 2FA', 'error');
                // Revert toggle if failed
                twoFactorToggle.checked = !isEnabled;
            }
        } catch (error) {
            console.error('2FA toggle error:', error);
            this.showStatus('Failed to update 2FA', 'error');
            // Revert toggle if failed
            twoFactorToggle.checked = !isEnabled;
        }
    }
    
    async handleAvailabilityToggle() {
        const availabilityToggle = document.getElementById('availabilityToggle');
        const isAvailable = availabilityToggle?.checked;
        
        // Update availability status display
        const availabilityStatus = document.querySelector('#profileSection .bg-green-400');
        if (availabilityStatus) {
            if (isAvailable) {
                availabilityStatus.classList.remove('bg-red-400');
                availabilityStatus.classList.add('bg-green-400');
                availabilityStatus.nextElementSibling.textContent = 'Available';
            } else {
                availabilityStatus.classList.remove('bg-green-400');
                availabilityStatus.classList.add('bg-red-400');
                availabilityStatus.nextElementSibling.textContent = 'Away';
            }
        }
        
        this.showStatus(`Status set to ${isAvailable ? 'Available' : 'Away'}`, 'success');
    }
    
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showStatus('File size too large. Please choose a file under 10MB.', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch('http://localhost:3000/api/profile/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showStatus('Avatar updated successfully!', 'success');
                
                // Update avatar display
                const profileAvatar = document.getElementById('profileAvatar');
                if (profileAvatar) {
                    profileAvatar.src = data.avatar_url + '?t=' + Date.now(); // Cache bust
                }
                
                this.currentUser.avatar_url = data.avatar_url;
            } else {
                const data = await response.json();
                this.showStatus(data.error || 'Failed to update avatar', 'error');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showStatus('Failed to update avatar', 'error');
        }
    }
    
    loadProfileData() {
        if (this.currentUser) {
            this.updateProfileDisplay();
        }
    }
    
    updateProfileDisplay() {
        // Update profile display with current user data
        const profileUsername = document.getElementById('profileUsername');
        const profileEmail = document.getElementById('profileEmail');
        const profileGames = document.getElementById('profileGames');
        const profileWins = document.getElementById('profileWins');
        const profileLosses = document.getElementById('profileLosses');
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        
        if (profileUsername) profileUsername.textContent = this.currentUser.username || 'Player';
        if (profileEmail) profileEmail.textContent = this.currentUser.email || '';
        if (profileGames) profileGames.textContent = this.currentUser.games_played || 0;
        if (profileWins) profileWins.textContent = this.currentUser.wins || 0;
        if (profileLosses) profileLosses.textContent = this.currentUser.losses || 0;
        if (twoFactorToggle) twoFactorToggle.checked = this.currentUser.two_factor_enabled || false;
        
        // Update avatar if available
        if (this.currentUser.avatar_url && this.currentUser.avatar_url !== 'default-avatar.png') {
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                profileAvatar.src = this.currentUser.avatar_url;
            }
        }
    }
    
    async loadHomePageStats() {
        if (this.currentUser && this.authToken) {
            try {
                const response = await fetch('http://localhost:3000/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const user = data.user;
                    
                    // Update home page stats
                    const homeGamesPlayed = document.getElementById('homeGamesPlayed');
                    const homeWins = document.getElementById('homeWins');
                    const homeLosses = document.getElementById('homeLosses');
                    
                    if (homeGamesPlayed) homeGamesPlayed.textContent = user.games_played || 0;
                    if (homeWins) homeWins.textContent = user.wins || 0;
                    if (homeLosses) homeLosses.textContent = user.losses || 0;
                }
            } catch (error) {
                console.error('Failed to load home page stats:', error);
            }
        }
    }

    endGame(winner) {
        this.gameState.isActive = false;
        
        // Stop the game loop
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        const gameMessage = document.getElementById('gameMessage');
        if (gameMessage) {
            gameMessage.textContent = `${winner} wins! Final Score: ${this.gameState.player1Score || this.gameState.playerScore} - ${this.gameState.player2Score || this.gameState.aiScore}`;
            gameMessage.style.display = 'block';
            gameMessage.style.fontSize = '24px';
            gameMessage.style.color = '#ff69b4';
            gameMessage.style.textAlign = 'center';
            gameMessage.style.marginTop = '20px';
        }
        
        // Show restart and home buttons
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.style.display = 'block';
            startButton.textContent = 'Play Again';
            startButton.className = 'bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded mr-4';
            startButton.onclick = () => {
                this.restartGame();
            };
        }
        
        // Add Go Home button
        const homeButton = document.createElement('button');
        homeButton.textContent = 'Go Home';
        homeButton.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded';
        homeButton.onclick = () => {
            this.showSection('homeSection');
        };
        
        // Insert home button after start button
        if (startButton && startButton.parentNode) {
            startButton.parentNode.insertBefore(homeButton, startButton.nextSibling);
        }
        
        // Update database with game result
        this.updateGameStats(winner);
        
        this.showStatus(`Game Over! ${winner} wins!`, 'success');
    }
    
    updateGameStats(winner) {
        const isWinner = winner === 'Player 1';
        const gameData = {
            games_played: 1,
            wins: isWinner ? 1 : 0,
            losses: isWinner ? 0 : 1
        };
        
        fetch('/api/users/profile/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(gameData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Game stats updated successfully');
                // Refresh home page stats
                this.loadHomePageStats();
            } else {
                console.error('Failed to update game stats:', data.message);
            }
        })
        .catch(error => {
            console.error('Error updating game stats:', error);
        });
    }
    
    restartGame() {
        // Reset scores
        if (this.gameState.type === 'local') {
            this.gameState.player1Score = 0;
            this.gameState.player2Score = 0;
        } else {
            this.gameState.playerScore = 0;
            this.gameState.aiScore = 0;
        }
        
        this.updateGameScore();
        
        // Reset button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.style.display = 'none';
        }
        
        // Start new countdown
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            this.startCountdown(canvas, this.gameState.type === 'ai');
        }
    }
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SimpleAuth...');
    const simpleAuth = new SimpleAuth();
    // Make it globally accessible for testing
    window.simpleAuth = simpleAuth;
    console.log('SimpleAuth initialized and made global');
});
// Global function for game selection (for onclick attributes)
window.startGame = function (gameType) {
    console.log('Global startGame called with:', gameType);
    // This will be handled by the SimpleAuth instance
};
