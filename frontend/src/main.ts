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
    }

    private async handleRegistration(): Promise<void> {
        const username = (document.getElementById('regUsername') as HTMLInputElement)?.value;
        const email = (document.getElementById('regEmail') as HTMLInputElement)?.value;
        const password = (document.getElementById('regPassword') as HTMLInputElement)?.value;

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
            } else {
                this.showStatus(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showStatus('Registration failed. Please try again.', 'error');
        }
    }

    private async handleLogin(): Promise<void> {
        const email = (document.getElementById('loginEmail') as HTMLInputElement)?.value;
        const password = (document.getElementById('loginPassword') as HTMLInputElement)?.value;

        if (!email || !password) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include' // Include cookies
            });

            const data = await response.json();

            if (response.ok) {
                // The backend sets the token as a cookie, so we don't need to store it manually
                // But we can store user info from the response if available
                if (data.user) {
                    this.currentUser = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                this.showStatus('Login successful! Redirecting to home...', 'success');
                setTimeout(() => {
                    this.showPage('mainApp');
                    this.showSection('homeSection');
                }, 2000);
            } else {
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
            this.currentUser = JSON.parse(user);
            this.showPage('mainApp');
            this.showSection('homeSection');
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
            });
        }

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

        // For now, just show a message since the game endpoints need to be implemented
        this.showStatus(`Starting ${gameType} game... (Feature coming soon!)`, 'success');
        
        // TODO: Implement actual game creation when backend endpoints are ready
        // This would typically connect to WebSocket endpoints for real-time gaming
        console.log('Game selection:', gameType);
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