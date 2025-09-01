// Simple Authentication System
class SimpleAuth {
    private currentUser: any = null;
    private authToken: string | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        console.log('SimpleAuth initializing...');
        this.checkAuthStatus();
        this.setupEventListeners();
        this.setupMainAppNavigation();
        this.setupGameOptions();
    }

    private setupEventListeners(): void {
        // Form submissions
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Registration form submitted, calling handleRegistration');
                this.handleRegistration();
            });
            console.log('Registration form listener attached');
        } else {
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
        } else {
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
                this.updatePasswordRequirements((e.target as HTMLInputElement).value);
            });
            console.log('Password input listener attached');
        }

        // Main app navigation
        this.setupMainAppNavigation();
        
        // Profile event listeners
        this.setupProfileEventListeners();
    }

    private setupProfileEventListeners(): void {
        // Username change button
        const changeUsernameBtn = document.getElementById('changeUsernameBtn');
        if (changeUsernameBtn) {
            changeUsernameBtn.addEventListener('click', () => {
                this.handleUsernameChange();
            });
        }

        // Email change button - disabled since backend doesn't support email updates
        const changeEmailBtn = document.getElementById('changeEmailBtn');
        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', () => {
                this.showStatus('Email updates are not supported yet', 'error');
            });
        }

        // Test authentication button (for debugging)
        const testAuthBtn = document.getElementById('testAuthBtn');
        if (testAuthBtn) {
            testAuthBtn.addEventListener('click', () => {
                this.testAuthentication();
            });
        }
    }

    private async testAuthentication(): Promise<void> {
        try {
            console.log('Testing authentication...');
            const response = await fetch('http://localhost:3000/api/profile/test-auth', {
                method: 'GET',
                credentials: 'include'
            });

            console.log('Test auth response status:', response.status);
            console.log('Test auth response headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('Test auth success:', data);
                alert('Authentication is working! Check console for details.');
            } else {
                const errorData = await response.json();
                console.error('Test auth failed:', errorData);
                alert(`Authentication failed: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Test auth error:', error);
            alert('Network error testing authentication');
        }
    }

    private async handleUsernameChange(): Promise<void> {
        const newUsernameInput = document.getElementById('newUsername') as HTMLInputElement;
        const newUsername = newUsernameInput?.value.trim();

        if (!newUsername) {
            alert('Please enter a new username');
            return;
        }

        if (!this.currentUser) {
            alert('Please log in to change username');
            return;
        }

        // Debug: Check if we have a token in localStorage
        console.log('Current user:', this.currentUser);
        console.log('localStorage user:', localStorage.getItem('user'));

        // Check if backend is running first
        try {
            console.log('Testing backend connection...');
            const healthCheck = await fetch('http://localhost:3000/api/profile/me', {
                method: 'GET',
                credentials: 'include'
            });
            
            console.log('Health check status:', healthCheck.status);
            console.log('Health check headers:', healthCheck.headers);
            
            if (healthCheck.status === 401) {
                const errorData = await healthCheck.json();
                console.log('Health check error:', errorData);
                alert('Session expired. Please login again.');
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showPage('loginPage');
                return;
            }
        } catch (error) {
            console.error('Health check failed:', error);
            alert('Cannot connect to server. Please make sure the backend is running.');
            return;
        }

        try {
            console.log('Sending username update request:', { newUsername });
            const response = await fetch('http://localhost:3000/api/profile/username', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newUsername }),
                credentials: 'include'
            });

            console.log('Username update response status:', response.status);
            console.log('Username update response headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('Username update response:', data);
                
                // Update local user data
                this.currentUser.username = newUsername;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                
                // Update display
                this.updateProfileDisplay();
                
                // Clear input
                newUsernameInput.value = '';
                
                alert('Username updated successfully!');
            } else if (response.status === 401) {
                // Unauthorized - user needs to login again
                const errorData = await response.json();
                console.error('Username update 401 error:', errorData);
                alert('Session expired. Please login again.');
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showPage('loginPage');
            } else {
                const errorData = await response.json();
                console.error('Username update error:', errorData);
                alert(errorData.error || 'Failed to update username');
            }
        } catch (error) {
            console.error('Error updating username:', error);
            alert('Network error updating username. Please check if the backend server is running.');
        }
    }

    private async handleRegistration(): Promise<void> {
        console.log('=== REGISTRATION STARTED ===');
        const username = (document.getElementById('regUsername') as HTMLInputElement)?.value;
        const email = (document.getElementById('regEmail') as HTMLInputElement)?.value;
        const password = (document.getElementById('regPassword') as HTMLInputElement)?.value;

        console.log('Registration data:', { username, email, password: password ? '***' : 'empty' });

        if (!username || !email || !password) {
            console.log('Missing required fields');
            this.showStatus('Please fill in all fields', 'error');
            return;
        }

        try {
            console.log('Sending registration request to:', 'http://localhost:3000/api/auth/registerUser');
            const response = await fetch('http://localhost:3000/api/auth/registerUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            console.log('Registration response status:', response.status);
            console.log('Registration response headers:', response.headers);

            const data = await response.json();
            console.log('Registration response data:', data);

            if (response.ok) {
                console.log('Registration successful');
                this.showStatus('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                console.log('Registration failed:', data.error);
                this.showStatus(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showStatus('Registration failed. Please try again.', 'error');
        }
    }

    private async handleLogin(): Promise<void> {
        console.log('=== LOGIN STARTED ===');
        const email = (document.getElementById('loginEmail') as HTMLInputElement)?.value;
        const password = (document.getElementById('loginPassword') as HTMLInputElement)?.value;

        console.log('Login data:', { email, password: password ? '***' : 'empty' });

        if (!email || !password) {
            console.log('Missing required fields');
            this.showStatus('Please fill in all fields', 'error');
            return;
        }

        try {
            console.log('Sending login request to:', 'http://localhost:3000/api/auth/login');
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include' // Include cookies
            });

            console.log('Login response status:', response.status);
            console.log('Login response headers:', response.headers);

            const data = await response.json();
            console.log('Login response data:', data);

            if (response.ok) {
                console.log('Login successful');
                // The backend sets the token as a cookie, so we don't need to store it manually
                // But we can store user info from the response if available
                if (data.user) {
                    this.currentUser = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                    this.updateProfileDisplay(); // Update profile display with user data
                }
                
                this.showStatus('Login successful! Redirecting to home...', 'success');
                setTimeout(() => {
                    this.showPage('mainApp');
                    this.showSection('homeSection');
                }, 2000);
            } else {
                console.log('Login failed:', data.error);
                this.showStatus(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showStatus('Login failed. Please try again.', 'error');
        }
    }

    private checkAuthStatus(): void {
        const user = localStorage.getItem('user');

        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                
                // Check if we need to refresh the token
                this.checkTokenExpiration();
                
                // Always load fresh user data from server to get updated stats
                this.loadUserProfile();
                this.showPage('mainApp');
                this.showSection('homeSection');
                // Update home dashboard immediately with cached data
                this.updateHomeDashboard();
            } catch (error) {
                console.error('Error parsing user from localStorage:', error);
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showPage('registrationPage');
            }
        } else {
            this.showPage('registrationPage');
        }
    }

    private async handleLogout(): Promise<void> {
        try {
            // Call the logout endpoint to clear the server-side cookie
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.currentUser = null;
        localStorage.removeItem('user');
        
        this.showStatus('Logged out successfully', 'success');
        setTimeout(() => {
            this.showPage('registrationPage');
        }, 1000);
    }

    private showStatus(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
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

    private showPage(pageId: string): void {
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
        } else {
            console.error(`Page not found: ${pageId}`);
        }
    }

    private showSection(sectionId: string): void {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`Showing section: ${sectionId}`);
            
            // If showing profile section, load fresh data
            if (sectionId === 'profileSection' && this.currentUser) {
                console.log('Profile section shown, loading fresh data...');
                setTimeout(() => {
                    this.loadUserProfile();
                }, 100);
            }
        } else {
            console.error(`Section not found: ${sectionId}`);
        }
    }

    private updatePasswordRequirements(password: string): void {
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

    private setupMainAppNavigation(): void {
        const navHome = document.getElementById('navHome');
        const navFriends = document.getElementById('navFriends');
        const navProfile = document.getElementById('navProfile');
        const navLogout = document.getElementById('navLogout');

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
                this.loadUserProfile(); // Load user profile data
            });
        }

        // Add refresh stats button listener
        const refreshStatsBtn = document.getElementById('refreshStatsBtn');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Refresh stats button clicked');
                this.loadUserProfile();
            });
        }

        // Add clear cache button listener - removed

        // Add test auth button listener - removed
        // Add test game stats button listener - removed

        if (navLogout) {
            navLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    private setupGameOptions(): void {
        // Add click handlers for game options
        const gameOptions = document.querySelectorAll('[data-game-type]');
        console.log('Found game options:', gameOptions.length);
        
        gameOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const gameType = (e.currentTarget as HTMLElement).getAttribute('data-game-type');
                console.log('Game option clicked:', gameType);
                this.handleGameSelection(gameType || '1v1');
            });
        });
    }

    private async handleGameSelection(gameType: string): Promise<void> {
        if (!this.currentUser) {
            this.showStatus('Please log in to play games', 'error');
            return;
        }

        // Check authentication before proceeding
        try {
            const response = await fetch('http://localhost:3000/api/profile/me', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.error('Authentication failed, redirecting to login');
                this.showStatus('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    this.showPage('registrationPage');
                }, 2000);
                return;
            }
        } catch (error) {
            console.error('Network error checking authentication:', error);
            this.showStatus('Network error. Please try again.', 'error');
            return;
        }

        if (gameType === '1v1') {
            // Redirect to game section for 1v1 local game
            this.showSection('gameSection');
            console.log('Game section shown, initializing game...');
            setTimeout(() => {
                this.initializeGame();
            }, 100); // Small delay to ensure DOM is ready
        } else {
            // For other game types, show a message for now
            this.showStatus(`${gameType} game coming soon!`, 'success');
        }
        
        console.log('Game selection:', gameType);
    }

    private initializeGame(): void {
        console.log('=== INITIALIZING GAME ===');
        
        // Set up the game canvas and controls
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        const startButton = document.getElementById('startButton');
        const gameOverlay = document.getElementById('gameOverlay');
        const gameMessage = document.getElementById('gameMessage');
        const player1Name = document.getElementById('player1Name');
        const player2Name = document.getElementById('player2Name');
        const customizeButton = document.getElementById('customizeBtn');

        console.log('Game elements found:', {
            canvas: !!canvas,
            ctx: !!ctx,
            startButton: !!startButton,
            gameOverlay: !!gameOverlay,
            gameMessage: !!gameMessage,
            player1Name: !!player1Name,
            player2Name: !!player2Name,
            customizeButton: !!customizeButton
        });

        if (!canvas || !ctx || !startButton || !gameOverlay || !gameMessage || !player1Name || !player2Name || !customizeButton) {
            console.error('Game elements not found');
            return;
        }

        // Reset game state completely
        this.resetGameState();

        // Set player names
        player1Name.textContent = this.currentUser.username || 'Player 1';
        player2Name.textContent = 'Local Player';

        // Reset scores
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        if (player1Score) player1Score.textContent = '0';
        if (player2Score) player2Score.textContent = '0';

        // Show game overlay with just the start button (no white box)
        gameOverlay.style.display = 'flex';
        console.log('Game overlay display set to:', gameOverlay.style.display);
        gameMessage.textContent = ''; // Remove welcome message
        startButton.style.display = 'block';
        startButton.textContent = 'Start Game';

        // Show customize button (it's now positioned absolutely in top-left)
        customizeButton.style.display = 'block';
        console.log('Customize button display set to:', customizeButton.style.display);

        // Remove any existing custom buttons from previous game
        const buttonContainer = gameOverlay.querySelector('.flex.justify-center.space-x-4');
        if (buttonContainer) {
            buttonContainer.remove();
        }

        // Draw initial game state (ball and paddles in center)
        this.drawGame();

        // Remove existing event listeners to prevent duplicates
        const newStartButton = startButton.cloneNode(true);
        startButton.parentNode?.replaceChild(newStartButton, startButton);
        const newCustomizeBtn = customizeButton.cloneNode(true);
        customizeButton.parentNode?.replaceChild(newCustomizeBtn, customizeButton);

        // Start button handler
        newStartButton.addEventListener('click', () => {
            console.log('Start button clicked!');
            gameOverlay.style.display = 'none';
            this.startLocalGame();
        });

        // Customize button handler
        newCustomizeBtn.addEventListener('click', () => {
            console.log('Customize button clicked!');
            this.showCustomizationModal();
        });

        // Set up keyboard controls
        this.setupGameControls();
        
        console.log('Game initialized successfully');
    }

    private resetGameState(): void {
        // Reset game state to initial values
        this.gameState = {
            ballPositionX: 400,
            ballPositionY: 300,
            speedX: 5,
            speedY: 3,
            radius: 10,
            canvasHeight: 600,
            leftPaddleX: 50,
            leftPaddleY: 250,
            rightPaddleX: 735,
            rightPaddleY: 250,
            paddleWidth: 15,
            paddleHeight: 100,
            canvasWidth: 800,
            scorePlayer1: 0,
            scorePlayer2: 0,
            maxScore: 5,
            player1Keys: { up: false, down: false },
            player2Keys: { up: false, down: false }
        };

        // Clear any existing game loop
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
    }

    private setupGameControls(): void {
        // Remove existing listeners to prevent duplicates
        document.removeEventListener('keydown', this.handleGameKeyDown);
        document.removeEventListener('keyup', this.handleGameKeyUp);

        // Add new listeners
        document.addEventListener('keydown', this.handleGameKeyDown.bind(this));
        document.addEventListener('keyup', this.handleGameKeyUp.bind(this));
    }

    private handleGameKeyDown(event: KeyboardEvent): void {
        if (!this.gameState) return;

        switch (event.key.toLowerCase()) {
            case 'w':
                this.gameState.player1Keys.up = true;
                break;
            case 's':
                this.gameState.player1Keys.down = true;
                break;
            case 'arrowup':
                this.gameState.player2Keys.up = true;
                break;
            case 'arrowdown':
                this.gameState.player2Keys.down = true;
                break;
        }
    }

    private handleGameKeyUp(event: KeyboardEvent): void {
        if (!this.gameState) return;

        switch (event.key.toLowerCase()) {
            case 'w':
                this.gameState.player1Keys.up = false;
                break;
            case 's':
                this.gameState.player1Keys.down = false;
                break;
            case 'arrowup':
                this.gameState.player2Keys.up = false;
                break;
            case 'arrowdown':
                this.gameState.player2Keys.down = false;
                break;
        }
    }

    private gameState: any = null;
    private gameLoopInterval: number | null = null;

    // Customization settings
    private customizationSettings = {
        tableColor: '#0f0f23',
        paddleColor: '#e94560'
    };

    private startLocalGame(): void {
        // Initialize game state
        this.gameState = {
            ballPositionX: 400,
            ballPositionY: 300,
            speedX: 5,
            speedY: 3,
            radius: 10,
            canvasHeight: 600,
            leftPaddleX: 50,
            leftPaddleY: 250,
            rightPaddleX: 735,
            rightPaddleY: 250,
            paddleWidth: 15,
            paddleHeight: 100,
            canvasWidth: 800,
            scorePlayer1: 0,
            scorePlayer2: 0,
            maxScore: 5,
            player1Keys: { up: false, down: false },
            player2Keys: { up: false, down: false }
        };

        // Keep customize button visible during gameplay
        const customizeBtn = document.getElementById('customizeBtn');
        if (customizeBtn) {
            customizeBtn.style.display = 'block';
        }

        // Start game loop
        this.gameLoopInterval = setInterval(() => {
            this.updateGame();
        }, 16); // ~60 FPS

        console.log('Local game started');
    }

    private updateGame(): void {
        if (!this.gameState) return;

        // Update paddle positions
        this.updatePaddlePositions();
        
        // Update ball position
        this.gameState.ballPositionX += this.gameState.speedX;
        this.gameState.ballPositionY += this.gameState.speedY;

        // Ball collision with top/bottom
        if (this.gameState.ballPositionY - this.gameState.radius <= 0 || 
            this.gameState.ballPositionY + this.gameState.radius >= this.gameState.canvasHeight) {
            this.gameState.speedY *= -1;
        }

        // Ball collision with left wall (Player 2 scores)
        if (this.gameState.ballPositionX - this.gameState.radius <= 0) {
            this.gameState.scorePlayer2++;
            this.resetBall();
            this.updateScoreDisplay();
            
            if (this.gameState.scorePlayer2 >= this.gameState.maxScore) {
                this.endGame(2);
                return;
            }
        }

        // Ball collision with right wall (Player 1 scores)
        if (this.gameState.ballPositionX + this.gameState.radius >= this.gameState.canvasWidth) {
            this.gameState.scorePlayer1++;
            this.resetBall();
            this.updateScoreDisplay();
            
            if (this.gameState.scorePlayer1 >= this.gameState.maxScore) {
                this.endGame(1);
                return;
            }
        }

        // Check paddle collisions
        this.checkPaddleCollisions();

        // Draw the game
        this.drawGame();
    }

    private updatePaddlePositions(): void {
        const paddleSpeed = 8;

        // Player 1 (W/S keys)
        if (this.gameState.player1Keys.up) {
            this.gameState.leftPaddleY = Math.max(0, this.gameState.leftPaddleY - paddleSpeed);
        }
        if (this.gameState.player1Keys.down) {
            this.gameState.leftPaddleY = Math.min(
                this.gameState.canvasHeight - this.gameState.paddleHeight, 
                this.gameState.leftPaddleY + paddleSpeed
            );
        }

        // Player 2 (Arrow keys)
        if (this.gameState.player2Keys.up) {
            this.gameState.rightPaddleY = Math.max(0, this.gameState.rightPaddleY - paddleSpeed);
        }
        if (this.gameState.player2Keys.down) {
            this.gameState.rightPaddleY = Math.min(
                this.gameState.canvasHeight - this.gameState.paddleHeight, 
                this.gameState.rightPaddleY + paddleSpeed
            );
        }
    }

    private checkPaddleCollisions(): void {
        // Left paddle collision
        if (this.gameState.ballPositionX - this.gameState.radius <= this.gameState.leftPaddleX + this.gameState.paddleWidth &&
            this.gameState.ballPositionY >= this.gameState.leftPaddleY &&
            this.gameState.ballPositionY <= this.gameState.leftPaddleY + this.gameState.paddleHeight) {
            this.gameState.speedX = Math.abs(this.gameState.speedX);
            this.addSpin();
        }

        // Right paddle collision
        if (this.gameState.ballPositionX + this.gameState.radius >= this.gameState.rightPaddleX &&
            this.gameState.ballPositionY >= this.gameState.rightPaddleY &&
            this.gameState.ballPositionY <= this.gameState.rightPaddleY + this.gameState.paddleHeight) {
            this.gameState.speedX = -Math.abs(this.gameState.speedX);
            this.addSpin();
        }
    }

    private addSpin(): void {
        const spin = (Math.random() - 0.5) * 2;
        this.gameState.speedY += spin;
        // Keep speed within reasonable bounds
        this.gameState.speedY = Math.max(-8, Math.min(8, this.gameState.speedY));
    }

    private resetBall(): void {
        this.gameState.ballPositionX = this.gameState.canvasWidth / 2;
        this.gameState.ballPositionY = this.gameState.canvasHeight / 2;
        this.gameState.speedX = Math.random() > 0.5 ? 5 : -5;
        this.gameState.speedY = (Math.random() - 0.5) * 6;
    }

    private updateScoreDisplay(): void {
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        
        if (player1Score) player1Score.textContent = this.gameState.scorePlayer1.toString();
        if (player2Score) player2Score.textContent = this.gameState.scorePlayer2.toString();
    }

    private showCustomizationModal(): void {
        const modal = document.getElementById('customizeModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.setupColorOptions();
        }
    }

    private hideCustomizationModal(): void {
        const modal = document.getElementById('customizeModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    private setupColorOptions(): void {
        // Setup color option click handlers
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const color = target.getAttribute('data-color');
                const type = target.getAttribute('data-type');
                
                if (color && type) {
                    if (type === 'table') {
                        this.customizationSettings.tableColor = color;
                    } else if (type === 'paddle') {
                        this.customizationSettings.paddleColor = color;
                    }
                    
                    // Update the game display
                    this.drawGame();
                    
                    // Add visual feedback
                    target.style.borderColor = '#10b981';
                    target.style.borderWidth = '3px';
                    
                    // Remove feedback after a short delay
                    setTimeout(() => {
                        target.style.borderColor = '';
                        target.style.borderWidth = '';
                    }, 300);
                }
            });
        });

        // Setup close button
        const closeBtn = document.getElementById('closeCustomizeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideCustomizationModal();
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('customizeModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCustomizationModal();
                }
            });
        }
    }

    private drawGame(): void {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        
        if (!canvas || !ctx || !this.gameState) return;

        // Clear canvas with custom table color
        ctx.fillStyle = this.customizationSettings.tableColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw center line
        ctx.strokeStyle = '#533483';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw paddles with custom color
        ctx.fillStyle = this.customizationSettings.paddleColor;
        ctx.fillRect(this.gameState.leftPaddleX, this.gameState.leftPaddleY, this.gameState.paddleWidth, this.gameState.paddleHeight);
        ctx.fillRect(this.gameState.rightPaddleX, this.gameState.rightPaddleY, this.gameState.paddleWidth, this.gameState.paddleHeight);

        // Draw ball
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(this.gameState.ballPositionX, this.gameState.ballPositionY, this.gameState.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    private async endGame(winner: number): Promise<void> {
        console.log('=== GAME ENDED ===');
        console.log('Winner:', winner);
        console.log('Current user:', this.currentUser);
        
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        const gameOverlay = document.getElementById('gameOverlay');
        const gameMessage = document.getElementById('gameMessage');
        const startButton = document.getElementById('startButton');

        if (gameOverlay && gameMessage && startButton) {
            gameOverlay.style.display = 'flex';
            gameOverlay.style.alignItems = 'center';
            gameOverlay.style.justifyContent = 'center';
            gameOverlay.style.flexDirection = 'column';
            
            // Set winner message with enhanced styling
            if (winner === 1) {
                gameMessage.textContent = `🏆 ${this.currentUser.username} wins! 🏆`;
                gameMessage.className = 'text-4xl font-bold mb-8 text-white drop-shadow-lg text-center w-full';
                console.log('User won, showing result popup...');
            } else {
                gameMessage.textContent = '🏆 Local Player wins! 🏆';
                gameMessage.className = 'text-4xl font-bold mb-8 text-white drop-shadow-lg text-center w-full';
                console.log('User lost, showing result popup...');
            }
            
            // Hide the start button and customize button
            startButton.style.display = 'none';
            const customizeBtn = document.getElementById('customizeBtn');
            if (customizeBtn) {
                customizeBtn.style.display = 'none';
            }
            
            // Create Play Again button
            const playAgainBtn = document.createElement('button');
            playAgainBtn.id = 'playAgainBtn';
            playAgainBtn.className = 'bg-powerpuff-green hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl transition-colors transform hover:scale-105 mr-4 shadow-lg';
            playAgainBtn.textContent = '🎮 Play Again';
            playAgainBtn.addEventListener('click', async () => {
                console.log('Play Again clicked, updating stats...');
                await this.updateUserStats(winner === 1);
                this.startNewGame();
            });
            
            // Create Go to Home button
            const goHomeBtn = document.createElement('button');
            goHomeBtn.id = 'goHomeBtn';
            goHomeBtn.className = 'bg-powerpuff-purple hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full text-xl transition-colors transform hover:scale-105 shadow-lg';
            goHomeBtn.textContent = '🏠 Go to Home';
            goHomeBtn.addEventListener('click', async () => {
                console.log('Go to Home clicked, updating stats...');
                await this.updateUserStats(winner === 1);
                this.showSection('homeSection');
            });
            
            // Add buttons to the overlay with perfect centering
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-center items-center space-x-4 w-full';
            buttonContainer.style.marginTop = '2rem';
            buttonContainer.appendChild(playAgainBtn);
            buttonContainer.appendChild(goHomeBtn);
            
            // Remove old button container if it exists
            const oldButtonContainer = gameOverlay.querySelector('.flex.justify-center.space-x-4, .flex.justify-center.items-center.space-x-4');
            if (oldButtonContainer) {
                oldButtonContainer.remove();
            }
            
            // Add the new button container to the overlay
            gameOverlay.appendChild(buttonContainer);
        }

        console.log(`Game ended. Winner: Player ${winner}`);
    }

    private startNewGame(): void {
        console.log('Starting new game...');
        
        // Reset game state
        this.resetGameState();

        // Show overlay with buttons
        const gameOverlay = document.getElementById('gameOverlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'flex';
            
            // Reset to original start button
            const startButton = document.getElementById('startButton');
            if (startButton) {
                startButton.style.display = 'block';
                startButton.textContent = 'Start Game';
            }
            
            // Reset customize button (it's positioned absolutely)
            const customizeBtn = document.getElementById('customizeBtn');
            if (customizeBtn) {
                customizeBtn.style.display = 'block';
            }
            
            // Clear game message
            const gameMessage = document.getElementById('gameMessage');
            if (gameMessage) {
                gameMessage.textContent = '';
                gameMessage.className = 'text-3xl font-bold mb-6 text-white drop-shadow-lg';
            }
            
            // Remove custom buttons
            const buttonContainer = gameOverlay.querySelector('.flex.justify-center.space-x-4, .flex.justify-center.items-center.space-x-4');
            if (buttonContainer) {
                buttonContainer.remove();
            }
        }

        // Draw initial game state
        this.drawGame();

        console.log('New game started');
    }

        private async loadUserProfile(): Promise<void> {
        if (!this.currentUser) {
            console.log('No current user found, cannot load profile');
            return;
        }

        console.log('Loading user profile for user:', this.currentUser.id);
        console.log('Current cookies:', document.cookie);
        
        try {
            const response = await fetch('http://localhost:3000/api/profile/me', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Profile response status:', response.status);
            console.log('Profile response headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('Profile data received:', data);
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                this.updateProfileDisplay();
                console.log('Profile loaded and display updated');
            } else if (response.status === 401) {
                // Unauthorized - clear localStorage and redirect to login
                console.log('User not authenticated, clearing cache');
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showStatus('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    this.showPage('registrationPage');
                }, 2000);
            } else {
                console.error('Failed to load user profile:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                this.showStatus(`Failed to load profile data: ${response.status}`, 'error');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showStatus('Network error loading profile', 'error');
        }
    }

    private updateDebugInfo(): void {
        // Removed - no longer needed
    }

    private updateProfileDisplay(): void {
        if (!this.currentUser) {
            console.log('No current user found, cannot update profile display');
            return;
        }

        console.log('Updating profile display with user data:', this.currentUser);

        // Update profile information
        const profileUsername = document.getElementById('profileUsername');
        const profileEmail = document.getElementById('profileEmail');
        const profileGames = document.getElementById('profileGames');
        const profileWins = document.getElementById('profileWins');
        const profileLosses = document.getElementById('profileLosses');

        console.log('Found elements:', {
            profileUsername: !!profileUsername,
            profileEmail: !!profileEmail,
            profileGames: !!profileGames,
            profileWins: !!profileWins,
            profileLosses: !!profileLosses
        });

        if (profileUsername) {
            profileUsername.textContent = this.currentUser.username || 'Player';
            console.log('Updated username:', this.currentUser.username);
        }
        if (profileEmail) {
            profileEmail.textContent = this.currentUser.email || '';
            console.log('Updated email:', this.currentUser.email);
        }
        if (profileGames) {
            const gamesPlayed = this.currentUser.gamesPlayed || 0;
            profileGames.textContent = gamesPlayed.toString();
            console.log('Updated games played:', gamesPlayed);
        }
        if (profileWins) {
            const wins = this.currentUser.wins || 0;
            profileWins.textContent = wins.toString();
            console.log('Updated wins:', wins);
        }
        if (profileLosses) {
            const losses = this.currentUser.losses || 0;
            profileLosses.textContent = losses.toString();
            console.log('Updated losses:', losses);
        }

        // Force a visual update
        setTimeout(() => {
            console.log('Current display values:');
            if (profileGames) console.log('Games displayed:', profileGames.textContent);
            if (profileWins) console.log('Wins displayed:', profileWins.textContent);
            if (profileLosses) console.log('Losses displayed:', profileLosses.textContent);
        }, 100);

        // Also update home dashboard
        this.updateHomeDashboard();
    }

    private updateHomeDashboard(): void {
        if (!this.currentUser) return;

        const homeGamesPlayed = document.getElementById('homeGamesPlayed');
        const homeWins = document.getElementById('homeWins');
        const homeLosses = document.getElementById('homeLosses');

        if (homeGamesPlayed) {
            homeGamesPlayed.textContent = (this.currentUser.gamesPlayed || 0).toString();
        }
        if (homeWins) {
            homeWins.textContent = (this.currentUser.wins || 0).toString();
        }
        if (homeLosses) {
            homeLosses.textContent = (this.currentUser.losses || 0).toString();
        }
    }

    private async testBackendConnectivity(): Promise<void> {
        // Removed - no longer needed
    }

    private checkTokenExpiration(): void {
        console.log('=== CHECKING TOKEN EXPIRATION ===');
        
        // Get the token from cookies
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
        
        if (!tokenCookie) {
            localStorage.removeItem('user');
            this.currentUser = null;
            this.showPage('registrationPage');
            return;
        }
        
        const token = tokenCookie.split('=')[1];
        
        if (!token) {
            localStorage.removeItem('user');
            this.currentUser = null;
            this.showPage('registrationPage');
            return;
        }
        
        try {
            // Decode the JWT token (without verification)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeUntilExpiry = expirationTime - currentTime;
            
            // If token expires in less than 5 minutes, refresh it
            if (timeUntilExpiry < 5 * 60 * 1000) {
                this.refreshToken();
            }
        } catch (error) {
            console.error('Error checking token expiration:', error);
            localStorage.removeItem('user');
            this.currentUser = null;
            this.showPage('registrationPage');
        }
    }

    private async refreshToken(): Promise<void> {
        try {
            const response = await fetch('http://localhost:3000/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showPage('registrationPage');
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            localStorage.removeItem('user');
            this.currentUser = null;
            this.showPage('registrationPage');
        }
    }

    private clearCacheAndReload(): void {
        // Removed - no longer needed
    }

    private async updateUserStats(userWon: boolean): Promise<void> {
        if (!this.currentUser) {
            console.log('No current user found, cannot update stats');
            return;
        }

        console.log('=== UPDATING USER STATS ===');
        console.log('User won:', userWon);
        console.log('Current user ID:', this.currentUser.id);
        console.log('Current cookies:', document.cookie);

        // Show loading state
        // this.showStatus('Updating game stats...', 'info'); // Removed popup message

        try {
            const response = await fetch('http://localhost:3000/api/profile/update-stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    won: userWon
                }),
                credentials: 'include'
            });

            console.log('Update stats response status:', response.status);
            console.log('Update stats response headers:', response.headers);

            if (response.ok) {
                const updatedUser = await response.json();
                console.log('Stats update response:', updatedUser);
                this.currentUser = updatedUser.user;
                localStorage.setItem('user', JSON.stringify(updatedUser.user));
                this.updateProfileDisplay(); // Update the display with new stats
                console.log('User stats updated successfully');
            } else {
                console.error('Failed to update user stats:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                console.error('Response headers:', response.headers);
                console.error('Request URL:', response.url);
                this.showStatus(`Failed to update game stats: ${response.status} ${response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
            this.showStatus('Network error updating stats', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SimpleAuth...');
    const simpleAuth = new SimpleAuth();
    
    // Make it globally accessible for testing
    (window as any).simpleAuth = simpleAuth;
    
    console.log('SimpleAuth initialized and made global');
});

// Global function for game selection (for onclick attributes)
(window as any).startGame = function(gameType: string) {
    console.log('Global startGame called with:', gameType);
    // This will be handled by the SimpleAuth instance
}; 