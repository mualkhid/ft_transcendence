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
                body: JSON.stringify({ username, email, password }),
                credentials: 'include'
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
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                if (data.user) {
                    this.currentUser = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
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
        const user = localStorage.getItem('user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showPage('mainApp');
            this.showSection('homeSection');
        }
        else {
            this.showPage('registrationPage');
        }
        // Always try to fetch user info from backend
        this.fetchUserInfo();
        // Check session validity on every page load
        fetch('http://localhost:3000/api/protected', {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => {
            if (res.status === 401 || res.status === 403) {
                const statusElem = document.getElementById('status');
                if (statusElem) {
                    statusElem.textContent = 'Session expired. Please log in again.';
                    statusElem.style.display = 'block';
                }
            }
            return res.json();
        });
    }
    async handleLogout() {
        try {
            // Call the logout endpoint to clear the server-side cookie
            await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            this.currentUser = null;
            localStorage.removeItem('user');
            this.showStatus('Logged out successfully', 'success');
            setTimeout(() => {
                this.showPage('registrationPage');
            }, 1000);
        }
        catch (error) {
            console.error('Logout error:', error);
            this.showStatus('Logout failed. Please try again.', 'error');
        }
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
    async fetchUserInfo() {
        try {
            const res = await fetch('http://localhost:3000/api/me', { credentials: 'include' });
            const data = await res.json();
            if (data.user) {
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                this.showPage('mainApp');
                this.showSection('homeSection');
                this.showStatus(`Welcome, ${data.user.name || data.user.email}!`, 'success');
            }
            else {
                this.showStatus('Not authenticated. Please log in.', 'error');
                this.showPage('registrationPage');
            }
        }
        catch (error) {
            this.showStatus('Could not fetch user info. Please log in.', 'error');
            this.showPage('registrationPage');
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
