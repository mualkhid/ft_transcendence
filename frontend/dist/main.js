"use strict";
// Declare process for TypeScript without installing @types/node
const config = {
    hostIp: '__HOST_IP__'
};
if (config.hostIp === '__HOST_IP' + '__') {
    config.hostIp = 'localhost';
}
const HOST_IP = config.hostIp;
class SimpleAuth {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.gameState = null;
        this.gameLoopInterval = null;
        this.isGoingHome = false;
        this.localGameStartTime = null;
        this.remoteGameLeaveHandlersSetup = false;
        this.remoteGameEventHandlers = null;
        this.remoteGameAnimationFrameId = null;
        // AI Game state and configuration
        this.aiGameState = {
            ballX: 400,
            ballY: 300,
            ballSpeedX: 5,
            ballSpeedY: 3,
            ballRadius: 10,
            playerPaddleY: 250,
            aiPaddleY: 250,
            playerScore: 0,
            aiScore: 0,
            currentDifficulty: 'easy',
            gameStarted: false
        };
        this.aiGameStartTime = null;
        this.aiGameConfig = {
            CANVAS: { WIDTH: 800, HEIGHT: 600 },
            PADDLE: { WIDTH: 15, HEIGHT: 100, SPEED: 5 },
            BALL: { RADIUS: 10, SPEED: 5 },
            WINNING_SCORE: 5
        };
        this.aiGameWs = null;
        this.paddleHitAudio = null;
        this.scoreAudio = null;
        this.endGameAudio = null;
        this.aiGameAnimationId = null;
        this.aiGameKeys = { w: false, s: false };
        this.aiGameAvailableDifficulties = {};
        // Online game state
        this.onlineGameState = {
            matchmakingSocket: null,
            gameSocket: null,
            matchId: null,
            playerNumber: null,
            isConnected: false,
            isInMatch: false,
            gameFinished: false,
            gameState: {
                ballX: 400,
                ballY: 300,
                leftPaddleY: 250,
                rightPaddleY: 250,
                player1Score: 0,
                player2Score: 0,
                speedX: 5,
                speedY: 3
            },
            prevBallX: null,
            prevBallY: null
        };
        // Customization settings
        this.customizationSettings = {
            tableColor: '#0f0f23',
            paddleColor: '#e94560',
            myPaddleColor: '#7209b7', // Player's own paddle color
            opponentPaddleColor: '#e94560' // Opponent's paddle color
        };
        // Tournament functionality
        this.tournamentState = {
            players: [],
            currentRound: 0,
            currentMatch: 0,
            matches: [],
            bracket: []
        };
        this.currentTournamentMatch = null;
        this.originalEndGame = null;
        this.colorblindMode = false;
        this.init();
<<<<<<< HEAD
        this.initializeAudio();
        // Add global test function for debugging
        window.testPowerUps = () => {
            console.log('Testing power-ups...');
            console.log('Current gameState:', this.gameState);
            if (this.gameState) {
                console.log('powerupsEnabled:', this.gameState.powerupsEnabled);
                console.log('powerUpsSpawned:', this.gameState.powerUpsSpawned);
                console.log('activePowerUps:', this.gameState.powerUps.length);
                console.log('maxPowerUpsPerGame:', this.gameState.maxPowerUpsPerGame);
                // Force spawn a power-up
                this.spawnPowerUp();
                console.log('Force spawned a power-up');
            }
            else {
                console.log('No gameState available');
            }
        };
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
    }
    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.setupMainAppNavigation();
        this.setupGameOptions();
        this.setupDashboardNavigation();
        this.initializeColorblindMode();
        this.setupBrowserHistory();
<<<<<<< HEAD
        this.setupAllPowerupsToggles();
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
    }
    setupEventListeners() {
        // Form submissions
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }
        // Google Sign-In button
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => {
                window.location.href = '/api/auth/google';
            });
            console.log('Google Sign-In button listener attached');
        }
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        // Page navigation
        const showLoginBtn = document.getElementById('showLoginPage');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('loginPage');
            });
        }
        const showRegBtn = document.getElementById('showRegistrationPage');
        if (showRegBtn) {
            showRegBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('registrationPage');
            });
        }
        // Password validation
        const passwordInput = document.getElementById('regPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.updatePasswordRequirements(e.target.value);
            });
        }
        const twoFactorInput = document.getElementById('twoFactorCode');
        if (twoFactorInput) {
            twoFactorInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    await this.handleLogin();
                }
            });
        }
        // Main app navigation
        this.setupMainAppNavigation();
        // Profile event listeners
        this.setupProfileEventListeners();
    }
    setupProfileEventListeners() {
        // Username change button
        const changeUsernameBtn = document.getElementById('changeUsernameBtn');
        if (changeUsernameBtn) {
            changeUsernameBtn.addEventListener('click', () => {
                this.handleUsernameChange();
            });
        }
        // Password change button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.handlePasswordChange();
            });
        }
        // Password validation for new password field
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordRequirements(e.target.value);
            });
        }
        // Avatar upload
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete your account?')) {
                    try {
                        const response = await fetch(`/api/user/delete`, { method: 'DELETE', credentials: 'include' });
                        if (response.ok) {
                            alert('Account deleted.');
                            localStorage.removeItem('user');
                            this.currentUser = null;
                            window.location.href = '/';
                            window.location.reload(); // Optionally reload the page
                        }
                        else {
                            alert('Failed to delete account.');
                        }
                    }
                    catch (error) {
                        console.error('Error deleting account:', error);
                        alert('An error occurred while deleting your account.');
                    }
                }
            });
        }
        const anonymizeAccountBtn = document.getElementById('anonymizeAccountBtn');
        if (anonymizeAccountBtn) {
            anonymizeAccountBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to anonymize your account?')) {
                    try {
                        const response = await fetch('/api/user/anonymize', { method: 'POST', credentials: 'include' });
                        if (response.ok) {
                            alert('Account anonymized.');
                            window.location.reload(); // Optionally reload the page
                        }
                        else {
                            alert('Failed to anonymize account.');
                        }
                    }
                    catch (error) {
                        console.error('Error anonymizing account:', error);
                        alert('An error occurred while anonymizing your account.');
                    }
                }
            });
        }
        const downloadDataBtn = document.getElementById('downloadDataBtn');
        if (downloadDataBtn) {
            downloadDataBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/user/data', {
                        method: 'GET',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                            type: 'application/json'
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        // More descriptive filename
                        const timestamp = new Date().toISOString().split('T')[0];
                        a.download = `transcendence_data_${timestamp}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        alert('Your data has been downloaded successfully.');
                    }
                    else if (response.status === 401) {
                        alert('Session expired. Please login again.');
                        this.showPage('loginPage');
                    }
                    else {
                        alert('Failed to download data.');
                    }
                }
                catch (error) {
                    console.error('Error downloading data:', error);
                    alert('An error occurred while downloading your data.');
                }
            });
        }
        // 2FA Event Listeners 
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', async (e) => {
                const isEnabled = e.target.checked;
                const enable2faBtn = document.getElementById('enable2faBtn');
                if (isEnabled && !this.currentUser?.isTwoFactorEnabled) {
                    // Show the enable button
                    if (enable2faBtn)
                        enable2faBtn.style.display = 'block';
                }
                else if (!isEnabled && this.currentUser?.isTwoFactorEnabled) {
                    // Handle disable 2FA
                    if (confirm('Are you sure you want to disable 2FA?')) {
                        await this.disable2FA();
                    }
                    else {
                        // Revert toggle
                        e.target.checked = true;
                    }
                }
                else {
                    // Hide the enable button
                    if (enable2faBtn)
                        enable2faBtn.style.display = 'none';
                }
            });
        }
        // Enable 2FA Button
        const enable2faBtn = document.getElementById('enable2faBtn');
        if (enable2faBtn) {
            enable2faBtn.addEventListener('click', async () => {
                await this.setup2FA();
            });
        }
        // Verify 2FA Button
        const verify2faBtn = document.getElementById('verify2faBtn');
        if (verify2faBtn) {
            verify2faBtn.addEventListener('click', async () => {
                await this.verify2FA();
            });
        }
        // Copy Backup Codes Button
        const copyBackupCodes = document.getElementById('copyBackupCodes');
        if (copyBackupCodes) {
            copyBackupCodes.addEventListener('click', () => {
                const codes = Array.from(document.querySelectorAll('#backupCodes li'))
                    .map((li) => li.textContent)
                    .join('\n');
                navigator.clipboard.writeText(codes);
                this.showStatus('Backup codes copied to clipboard!', 'success');
            });
        }
        // Friends functionality
        this.setupFriendsEventListeners();
        // Tournament functionality
        this.setupTournamentEventListeners();
    }
    async setup2FA() {
        try {
            const response = await fetch(`https://${HOST_IP}/api/auth/setup-2fa`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                // Show instructions
                const instructionsDiv = document.getElementById('twofa-instructions');
                if (instructionsDiv)
                    instructionsDiv.style.display = 'block';
                // Show QR code and backup codes
                const qrImage = document.getElementById('qrImage');
                if (qrImage)
                    qrImage.src = data.qr;
                const backupCodesList = document.getElementById('backupCodes');
                if (backupCodesList) {
                    backupCodesList.innerHTML = '';
                    data.backupCodes.forEach((code) => {
                        const li = document.createElement('li');
                        li.textContent = code;
                        li.className = 'bg-gray-700 p-2 rounded font-mono text-sm mb-1';
                        backupCodesList.appendChild(li);
                    });
                }
                // Show the 2FA setup section
                const twofaSetupSection = document.getElementById('twofa-setup');
                if (twofaSetupSection)
                    twofaSetupSection.style.display = 'block';
                // Hide the enable button and disable toggle during setup
                const enable2faBtn = document.getElementById('enable2faBtn');
                if (enable2faBtn)
                    enable2faBtn.style.display = 'none';
                const twoFactorToggle = document.getElementById('twoFactorToggle');
                if (twoFactorToggle)
                    twoFactorToggle.disabled = true;
                this.showStatus('Scan the QR code with your authenticator app and save your backup codes!', 'info');
            }
            else {
                this.showStatus(data.error || 'Failed to setup 2FA', 'error');
            }
        }
        catch (error) {
            console.error('Error setting up 2FA:', error);
            this.showStatus('An error occurred while setting up 2FA.', 'error');
        }
    }
    async verify2FA() {
        const verifyCodeInput = document.getElementById('verify2faCode');
        const twoFactorCode = verifyCodeInput?.value;
        if (!twoFactorCode) {
            this.showStatus('Please enter the 6-digit code from your authenticator app', 'error');
            return;
        }
        try {
            const response = await fetch(`https://${HOST_IP}/api/auth/verify-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ twoFactorCode }),
                credentials: 'include',
            });
            if (response.ok) {
                this.showStatus('2FA setup complete!', 'success');
                // Hide setup sections
                const twofaSetupSection = document.getElementById('twofa-setup');
                if (twofaSetupSection)
                    twofaSetupSection.style.display = 'none';
                const instructionsDiv = document.getElementById('twofa-instructions');
                if (instructionsDiv)
                    instructionsDiv.style.display = 'none';
                // Re-enable toggle and update user state
                const twoFactorToggle = document.getElementById('twoFactorToggle');
                if (twoFactorToggle) {
                    twoFactorToggle.disabled = false;
                    twoFactorToggle.checked = true;
                }
                // Update current user data
                if (this.currentUser) {
                    this.currentUser.isTwoFactorEnabled = true;
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                }
                // Clear the verification input
                verifyCodeInput.value = '';
            }
            else {
                const errorData = await response.json();
                this.showStatus(errorData.error || 'Invalid verification code', 'error');
            }
        }
        catch (error) {
            console.error('Error verifying 2FA:', error);
            this.showStatus('An error occurred while verifying 2FA.', 'error');
        }
    }
    async disable2FA() {
        try {
            const response = await fetch(`https://${HOST_IP}/api/auth/disable-2fa`, {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                this.showStatus('2FA disabled successfully', 'success');
                // Update toggle and user state
                const twoFactorToggle = document.getElementById('twoFactorToggle');
                if (twoFactorToggle)
                    twoFactorToggle.checked = false;
                if (this.currentUser) {
                    this.currentUser.isTwoFactorEnabled = false;
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                }
            }
            else {
                const errorData = await response.json();
                this.showStatus(errorData.error || 'Failed to disable 2FA', 'error');
            }
        }
        catch (error) {
            console.error('Error disabling 2FA:', error);
            this.showStatus('An error occurred while disabling 2FA.', 'error');
        }
    }
    setupFriendsEventListeners() {
        // Search users input
        const searchUsersInput = document.getElementById('searchUsersInput');
        if (searchUsersInput) {
            searchUsersInput.addEventListener('input', (e) => {
                this.handleUserSearch(e.target.value);
            });
        }
        // Load friends data when friends section is shown
        const navFriends = document.getElementById('navFriends');
        if (navFriends) {
            navFriends.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🏠 Friends navigation clicked - saving section');
                this.showSection('friendsSection');
                this.loadFriendsData();
            });
        }
    }
    setupTournamentEventListeners() {
        // Player count selection
        const tournament4Players = document.getElementById('tournament4Players');
        if (tournament4Players) {
            tournament4Players.addEventListener('click', () => {
                this.setupTournament(4);
            });
        }
        // Start tournament button
        const startTournament = document.getElementById('startTournament');
        if (startTournament) {
            startTournament.addEventListener('click', () => {
                this.startTournament();
            });
        }
        // Start match button
        const startMatch = document.getElementById('startMatch');
        if (startMatch) {
            startMatch.addEventListener('click', () => {
                // Only start match if there's a current match available
                if (this.tournamentState.matches[this.tournamentState.currentMatch]) {
                    this.startCurrentMatch();
                }
            });
        }
        // Next match button
        const nextMatch = document.getElementById('nextMatch');
        if (nextMatch) {
            nextMatch.addEventListener('click', () => {
                this.nextMatch();
            });
        }
        // New tournament button
        const newTournament = document.getElementById('newTournament');
        if (newTournament) {
            newTournament.addEventListener('click', () => {
                this.resetTournament();
            });
        }
    }
    async handleUsernameChange() {
        const newUsernameInput = document.getElementById('newUsername');
        const newUsername = newUsernameInput?.value.trim();
        if (!newUsername) {
            this.showStatus('Please enter a new username', 'error');
            return;
        }
        if (!this.currentUser) {
            this.showStatus('Please log in to change username', 'error');
            return;
        }
        // Check if backend is running first
        try {
            console.log('Testing backend connection...');
            const healthCheck = await fetch(`https://${HOST_IP}/api/profile/me`, {
                method: 'GET',
                credentials: 'include'
            });
            console.log('Health check status:', healthCheck.status);
            console.log('Health check headers:', healthCheck.headers);
            if (healthCheck.status === 401) {
                const errorData = await healthCheck.json();
                console.log('Health check error:', errorData);
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
                return;
            }
        }
        catch (error) {
            console.error('Health check failed:', error);
            this.showStatus('Cannot connect to server. Please make sure the backend is running.', 'error');
            return;
        }
        try {
            const currentUsername = this.currentUser?.username;
            if (newUsername.trim() === currentUsername) {
                this.showStatus("New username cannot be the same as the current one", "error");
                return; // stop here, don’t send the request
            }
            console.log('Sending username update request:', { newUsername });
            console.log('Request URL:', `https://${HOST_IP}/api/profile/username`);
            console.log('Request method:', 'PATCH');
            console.log('Request headers:', {
                'Content-Type': 'application/json',
            });
            console.log('Request body:', JSON.stringify({ newUsername }));
            console.log('Credentials:', 'include');
            const response = await fetch(`https://${HOST_IP}/api/profile/username`, {
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
                this.showStatus('Username updated successfully!', 'success');
            }
            else if (response.status === 401) {
                const errorData = await response.json();
                console.error('Username update 401 error:', errorData);
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('Username update error:', errorData);
                this.showStatus(errorData.error || 'Failed to update username', 'error');
            }
        }
        catch (error) {
            console.error('Error updating username:', error);
            this.showStatus('Network error updating username. Please check if the backend server is running.', 'error');
        }
    }
    async handlePasswordChange() {
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const currentPassword = currentPasswordInput?.value.trim();
        const newPassword = newPasswordInput?.value.trim();
        if (!currentPassword || !newPassword) {
            this.showStatus('Please enter both current and new passwords', 'error');
            return;
        }
        if (!this.currentUser) {
            this.showStatus('Please log in to change password', 'error');
            return;
        }
        console.log('Password change - Current user:', this.currentUser);
        console.log('Password change - Current cookies:', document.cookie);
        // Validate new password meets requirements
        const requirements = {
            length: newPassword.length >= 8,
            lowercase: /[a-z]/.test(newPassword),
            uppercase: /[A-Z]/.test(newPassword),
            number: /\d/.test(newPassword),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
        };
        const allRequirementsMet = Object.values(requirements).every(met => met);
        if (!allRequirementsMet) {
            this.showStatus('New password does not meet all requirements', 'error');
            return;
        }
        try {
            console.log('Sending password update request');
            console.log('Request URL:', `https://${HOST_IP}/api/profile/password`);
            console.log('Request method:', 'PATCH');
            console.log('Request headers:', {
                'Content-Type': 'application/json',
            });
            console.log('Request body:', JSON.stringify({ currentPassword, newPassword: '***' }));
            console.log('Credentials:', 'include');
            const response = await fetch(`https://${HOST_IP}/api/profile/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword, newPassword }),
                credentials: 'include'
            });
            console.log('Password update response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Password update response:', data);
                // Clear inputs
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                // Reset password requirements display
                this.updatePasswordRequirements('');
                this.showStatus('Password updated successfully!', 'success');
            }
            else if (response.status === 401) {
                const errorData = await response.json();
                console.error('Password update 401 error:', errorData);
                // Check if it's a password error or session error
                if (errorData.error && errorData.error.includes('password Incorrect')) {
                    this.showStatus('Current password is incorrect', 'error');
                }
                else {
                    this.showStatus('Session expired. Please login again.', 'error');
                    localStorage.removeItem('user');
                    this.currentUser = null;
                    setTimeout(() => {
                        this.showPage('loginPage');
                    }, 2000);
                }
            }
            else if (response.status === 400) {
                const errorData = await response.json();
                console.error('Password update 400 error:', errorData);
                this.showStatus(errorData.message || 'Invalid request', 'error');
            }
            else {
                const errorData = await response.json();
                console.error('Password update error:', errorData);
                this.showStatus(errorData.message || errorData.error || 'Failed to update password', 'error');
            }
        }
        catch (error) {
            console.error('Password update error:', error);
            this.showStatus('Network error updating password. Please check if the backend server is running.', 'error');
        }
    }
    async handleAvatarUpload(event) {
        const fileInput = event.target;
        const file = fileInput.files?.[0];
        if (!file) {
            this.showStatus('Please select a file to upload', 'error');
            fileInput.value = ''; // Clear the file input
            return;
        }
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showStatus('Please select a valid image file (JPEG, PNG, or WebP)', 'error');
            fileInput.value = ''; // Clear the file input
            return;
        }
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showStatus('File size must be less than 5MB', 'error');
            fileInput.value = ''; // Clear the file input
            return;
        }
        if (!this.currentUser) {
            this.showStatus('Please log in to upload avatar', 'error');
            return;
        }
        try {
            console.log('Uploading avatar file:', file.name, 'Size:', file.size, 'Type:', file.type);
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await fetch(`https://${HOST_IP}/api/profile/avatar`, {
                method: 'PATCH',
                body: formData,
                credentials: 'include'
            });
            console.log('Avatar upload response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Avatar upload response:', data);
                // Update the avatar display
                const profileAvatar = document.getElementById('profileAvatar');
                if (profileAvatar) {
                    // Add timestamp to prevent caching
                    const avatarSrc = `https://${HOST_IP}${data.avatarUrl}?t=${Date.now()}`;
                    profileAvatar.src = avatarSrc;
                    console.log('✅ Updated profile avatar src to:', avatarSrc);
                }
                // Update current user data
                if (this.currentUser) {
                    this.currentUser.avatarUrl = data.avatarUrl;
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                    console.log('✅ Updated currentUser.avatarUrl to:', data.avatarUrl);
                }
                this.showStatus('Avatar uploaded successfully!', 'success');
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else if (response.status === 413) {
                this.showStatus('File too large. Please select a smaller image.', 'error');
                fileInput.value = ''; // Clear the file input
            }
            else if (response.status === 415) {
                this.showStatus('Unsupported file type. Please select JPEG, PNG, or WebP.', 'error');
                fileInput.value = ''; // Clear the file input
            }
            else {
                const errorData = await response.json();
                console.error('Avatar upload error:', errorData);
                this.showStatus(errorData.error || 'Failed to upload avatar', 'error');
                fileInput.value = ''; // Clear the file input
            }
        }
        catch (error) {
            console.error('Avatar upload error:', error);
            this.showStatus('Network error uploading avatar. Please check if the backend server is running.', 'error');
            fileInput.value = ''; // Clear the file input
            fileInput.value = ''; // Clear the file input
        }
    }
    async handleUserSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.clearUsersList();
            return;
        }
        if (!this.currentUser) {
            this.showStatus('Please log in to search users', 'error');
            return;
        }
        try {
            console.log('Searching users with term:', searchTerm);
            const response = await fetch(`https://${HOST_IP}/api/friends/searchUser?q=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                credentials: 'include'
            });
            console.log('User search response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('User search response:', data);
                this.displayUsers(data.users);
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('User search error:', errorData);
                this.showStatus(errorData.error || 'Failed to search users', 'error');
            }
        }
        catch (error) {
            console.error('User search error:', error);
            this.showStatus('Network error searching users. Please check if the backend server is running.', 'error');
        }
    }
    async loadFriendsData() {
        if (!this.currentUser) {
            this.showStatus('Please log in to load friends data', 'error');
            return;
        }
        try {
            console.log('Loading friends data...');
            const response = await fetch(`https://${HOST_IP}/api/friends`, {
                method: 'GET',
                credentials: 'include'
            });
            console.log('Friends data response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Friends data response:', data);
                this.displayFriends(data.friends);
                this.displayFriendRequests(data.pendingRequests);
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('Friends data error:', errorData);
                this.showStatus(errorData.error || 'Failed to load friends data', 'error');
            }
        }
        catch (error) {
            console.error('Friends data error:', error);
            this.showStatus('Network error loading friends data. Please check if the backend server is running.', 'error');
        }
    }
    displayUsers(users) {
        const usersList = document.getElementById('usersList');
        if (!usersList)
            return;
        if (users.length === 0) {
            usersList.innerHTML = `
                <div class="col-span-full text-center text-white">
                    <div class="text-4xl mb-2">🔍</div>
                    <p>No users found</p>
                </div>
            `;
            return;
        }
        usersList.innerHTML = users
            .filter(user => user.id !== this.currentUser?.id) // Don't show current user
            .map(user => `
                <div class="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="${user.avatarUrl && user.avatarUrl !== '/avatars/default.jpg' ? `https://${HOST_IP}${user.avatarUrl}?t=${Date.now()}` : `./imgs/default.jpg`}" 
                                 alt="${user.username}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-white border-opacity-30">
                        </div>
                        <div class="flex-1">
                            <h4 class="text-white font-semibold">${user.username}</h4>
                        </div>
                        <button id="sendRequestBtn_${user.id}" onclick="window.simpleAuth.sendFriendRequest(${user.id})" 
                                class="bg-powerpuff-blue hover:bg-powerpuff-purple text-white font-bold py-2 px-4 rounded transition-colors">
                            👋 Send Request
                        </button>
                    </div>
                </div>
            `).join('');
    }
    displayFriends(friends) {
        const friendsList = document.getElementById('friendsList');
        if (!friendsList)
            return;
        if (friends.length === 0) {
            friendsList.innerHTML = `
                <div class="text-center text-white">
                    <div class="text-4xl mb-2">👥</div>
                    <p>No friends yet</p>
                </div>
            `;
            return;
        }
        friendsList.innerHTML = friends.map(friend => {
            const isOnline = this.isUserOnline(friend.lastSeen);
            return `
                <div class="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="${friend.avatarUrl && friend.avatarUrl !== '/avatars/default.jpg' ? `https://${HOST_IP}${friend.avatarUrl}?t=${Date.now()}` : `./imgs/default.jpg`}" 
                                 alt="${friend.username}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-white border-opacity-30">
                            <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-400' : 'bg-gray-400'}"></div>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-white font-semibold">${friend.username}</h4>
                            <p class="text-white text-sm opacity-80">${isOnline ? '🟢 Online' : '⚫ Offline'}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="window.simpleAuth.removeFriend(${friend.id})" 
                                    class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors">
                                ❌ Remove
                            </button>
                            <button onclick="window.simpleAuth.blockFriend(${friend.id})" 
                                    class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors">
                                🚫 Block
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    displayFriendRequests(requests) {
        const friendRequests = document.getElementById('friendRequests');
        if (!friendRequests)
            return;
        if (requests.length === 0) {
            friendRequests.innerHTML = `
                <div class="text-center text-white">
                    <div class="text-4xl mb-2">📨</div>
                    <p>No pending requests</p>
                </div>
            `;
            return;
        }
        friendRequests.innerHTML = requests.map(request => `
            <div class="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div class="flex items-center space-x-3">
                    <div class="relative">
                        <img src="${request.avatarUrl && request.avatarUrl !== '/avatars/default.jpg' ? `https://${HOST_IP}${request.avatarUrl}?t=${Date.now()}` : `./imgs/default.jpg`}" 
                             alt="${request.username}" 
                             class="w-12 h-12 rounded-full object-cover border-2 border-white border-opacity-30">
                    </div>
                    <div class="flex-1">
                        <h4 class="text-white font-semibold">${request.username}</h4>
                        <p class="text-white text-sm opacity-80">Wants to be your friend!</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="window.simpleAuth.acceptFriendRequest(${request.id})" 
                                class="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors">
                            ✅ Accept
                        </button>
                        <button onclick="window.simpleAuth.declineFriendRequest(${request.id})" 
                                class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors">
                            ❌ Decline
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    clearUsersList() {
        const usersList = document.getElementById('usersList');
        if (usersList) {
            usersList.innerHTML = '';
        }
    }
    isUserOnline(lastSeen) {
        if (!lastSeen)
            return false;
        const lastSeenTime = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = (now.getTime() - lastSeenTime.getTime()) / (1000 * 60);
        return diffInMinutes < 2; // Consider online if last seen within 2 minutes for more accurate status
    }
    // Global methods for button clicks
    async sendFriendRequest(userId) {
        if (!this.currentUser) {
            this.showStatus('Please log in to send friend requests', 'error');
            return;
        }
        try {
            console.log('Sending friend request to user:', userId);
            const response = await fetch(`https://${HOST_IP}/api/friends/sendRequest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
                credentials: 'include'
            });
            console.log('Send friend request response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Send friend request response:', data);
                this.showStatus('Friend request sent successfully!', 'success');
                // Gray out the button
                const button = document.getElementById(`sendRequestBtn_${userId}`);
                if (button) {
                    button.textContent = '✅ Request Sent';
                    button.className = 'bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors cursor-not-allowed';
                    button.disabled = true;
                }
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('Send friend request error:', errorData);
                this.showStatus(errorData.error || 'Failed to send friend request', 'error');
            }
        }
        catch (error) {
            console.error('Send friend request error:', error);
            this.showStatus('Network error sending friend request. Please check if the backend server is running.', 'error');
        }
    }
    async acceptFriendRequest(userId) {
        if (!this.currentUser) {
            this.showStatus('Please log in to accept friend requests', 'error');
            return;
        }
        try {
            console.log('Accepting friend request from user:', userId);
            const response = await fetch(`https://${HOST_IP}/api/friends/acceptRequest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
                credentials: 'include'
            });
            console.log('Accept friend request response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Accept friend request response:', data);
                this.showStatus('Friend request accepted!', 'success');
                this.loadFriendsData(); // Refresh friends data
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('Accept friend request error:', errorData);
                this.showStatus(errorData.error || 'Failed to accept friend request', 'error');
            }
        }
        catch (error) {
            console.error('Accept friend request error:', error);
            this.showStatus('Network error accepting friend request. Please check if the backend server is running.', 'error');
        }
    }
    async declineFriendRequest(userId) {
        if (!this.currentUser) {
            this.showStatus('Please log in to decline friend requests', 'error');
            return;
        }
        try {
            console.log('Declining friend request from user:', userId);
            const response = await fetch(`https://${HOST_IP}/api/friends/declineRequest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
                credentials: 'include'
            });
            console.log('Decline friend request response status:', response.status);
            if (response.ok) {
                console.log('Friend request declined successfully');
                this.showStatus('Friend request declined', 'success');
                this.loadFriendsData(); // Refresh friends data
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('Decline friend request error:', errorData);
                this.showStatus(errorData.error || 'Failed to decline friend request', 'error');
            }
        }
        catch (error) {
            console.error('Decline friend request error:', error);
            this.showStatus('Network error declining friend request. Please check if the backend server is running.', 'error');
        }
    }
    async removeFriend(userId) {
        if (!this.currentUser) {
            this.showStatus('Please log in to remove friends', 'error');
            return;
        }
        try {
            console.log('Removing friend:', userId);
            const response = await fetch(`https://${HOST_IP}/api/friends/removeFriend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
                credentials: 'include'
            });
            console.log('Remove friend response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Remove friend response:', data);
                this.showStatus('Friend removed successfully!', 'success');
                this.loadFriendsData(); // Refresh friends data
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('Remove friend error:', errorData);
                this.showStatus(errorData.error || 'Failed to remove friend', 'error');
            }
        }
        catch (error) {
            console.error('Remove friend error:', error);
            this.showStatus('Network error removing friend. Please check if the backend server is running.', 'error');
        }
    }
    async blockFriend(userId) {
        if (!this.currentUser) {
            this.showStatus('Please log in to block friends', 'error');
            return;
        }
        try {
            console.log('Blocking friend:', userId);
            const response = await fetch(`https://${HOST_IP}/api/friends/blockFriend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
                credentials: 'include'
            });
            console.log('Block friend response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Block friend response:', data);
                this.showStatus('Friend blocked successfully!', 'success');
                this.loadFriendsData(); // Refresh friends data
            }
            else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            }
            else {
                const errorData = await response.json();
                console.error('Block friend error:', errorData);
                this.showStatus(errorData.error || 'Failed to block friend', 'error');
            }
        }
        catch (error) {
            console.error('Block friend error:', error);
            this.showStatus('Network error blocking friend. Please check if the backend server is running.', 'error');
        }
    }
    async handleRegistration() {
        console.log('=== REGISTRATION STARTED ===');
        const username = document.getElementById('regUsername')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        console.log('Registration data:', { username, email, password: password ? '***' : 'empty' });
        if (!username || !email || !password) {
            console.log('Missing required fields');
            this.showStatus('Please fill in all fields', 'error');
            return;
        }
        try {
            console.log('Sending registration request to:', `https://${HOST_IP}/api/auth/registerUser`);
            const response = await fetch(`https://${HOST_IP}/api/auth/registerUser`, {
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
            }
            else {
                console.log('Registration failed:', data.error);
                this.showStatus(data.error || 'Registration failed', 'error');
            }
        }
        catch (error) {
            console.error('Registration error:', error);
            this.showStatus('Registration failed. Please try again.', 'error');
        }
    }
    async handleLogin() {
        try {
            // Get form values
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            // Get 2FA code directly - don't rely on visibility detection
            const twoFactorInput = document.getElementById('twoFactorCode');
            const twoFactorCode = twoFactorInput?.value?.trim();
            // Create request body
            const requestBody = {
                email,
                password
            };
            // Always include 2FA code if it has a value, regardless of visibility
            if (twoFactorCode && twoFactorCode.length > 0) {
                requestBody.twoFactorCode = twoFactorCode;
                console.log(`Including 2FA code in request: ${twoFactorCode}`);
            }
            console.log('Login request body:', requestBody);
            const response = await fetch(`https://${HOST_IP}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            if (response.ok) {
                // Success - handle login
                this.currentUser = data.user;
                this.showPage('mainApp');
                this.loadUserProfile();
            }
            else if (response.status === 401 && data.require2FA) {
                // Show 2FA form
                const twoFactorContainer = document.getElementById('twoFactorCodeContainer');
                if (twoFactorContainer) {
                    twoFactorContainer.style.display = 'block';
                    // Focus on the input field
                    const twoFactorInput = document.getElementById('twoFactorCode');
                    if (twoFactorInput) {
                        twoFactorInput.focus();
                        twoFactorInput.value = ''; // Clear any previous value
                    }
                    this.showStatus('Please enter your two-factor authentication code', 'info');
                }
            }
            else {
                // Handle other errors - also hide 2FA form on error
                const twoFactorContainer = document.getElementById('twoFactorCodeContainer');
                if (twoFactorContainer) {
                    twoFactorContainer.style.display = 'none';
                }
                this.showStatus(data.error || 'Login failed', 'error');
            }
        }
        catch (error) {
            console.error('Login error:', error);
            this.showStatus('An error occurred during login', 'error');
        }
    }
    checkAuthStatus() {
        console.log("=== CHECKING AUTH STATUS ===");
        console.log("Method checkAuthStatus called at:", new Date().toISOString());
        // Check for Google OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const authParam = urlParams.get('auth');
        if (authParam === 'success') {
            console.log("🔍 Google OAuth success detected");
            // Clear the URL parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            // Force a check for the authentication cookie with a longer delay
            setTimeout(() => {
                this.verifyTokenAndShowApp();
            }, 500); // Increased delay to ensure cookie is set
            return;
        }
        else if (authParam === 'error') {
            console.log("❌ Google OAuth error detected");
            window.history.replaceState({}, document.title, window.location.pathname);
            this.showStatus("Google authentication failed. Please try again.", "error");
            this.showPage("loginPage");
            return;
        }
        const user = localStorage.getItem("user");
        console.log("localStorage user:", user);
        console.log("Current cookies:", document.cookie);
        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                console.log("Parsed current user:", this.currentUser);
                // Check if we have a valid authentication cookie
                const hasCookie = document.cookie.includes("token=");
                console.log("Has authentication cookie:", hasCookie);
                if (!hasCookie) {
                    console.log("⚠️ No authentication cookie found, but user data exists");
                    console.log("⚠️ Proceeding with cached user data...");
                    // Show the main app with cached data even without cookie
                    this.showPage("mainApp");
                    this.updateHomeDashboard();
                    this.updateProfileDisplay();
                    // Initialize history state after main app is shown
                    this.initializeHistoryState();
                    // Clear search input when restoring from localStorage
                    const searchInput = document.getElementById("searchUsersInput");
                    if (searchInput) {
                        searchInput.value = "";
                        this.clearUsersList();
                    }
                    // Always prioritize saved section on page load/refresh
                    const savedSection = localStorage.getItem("lastActiveSection");
                    const urlSection = this.getUrlSection();
                    if (savedSection) {
                        console.log("🔄 Restoring saved section:", savedSection);
                        this.showSection(savedSection, false); // Don't update history on initial load
                    }
                    else if (urlSection) {
                        console.log("🌐 URL section parameter found:", urlSection);
                        this.showSection(urlSection, false); // Don't update history on initial load
                    }
                    else {
                        console.log("🏠 No saved section, showing home");
                        this.showSection("homeSection", false); // Don't update history on initial load
                    }
                    return;
                }
                console.log("✅ Authentication cookie found, showing main app");
                // Show the main app with cached data
                this.showPage("mainApp");
                this.updateHomeDashboard();
                this.updateProfileDisplay();
                // Initialize history state after main app is shown
                this.initializeHistoryState();
                // Clear search input when restoring from localStorage
                const searchInput = document.getElementById("searchUsersInput");
                if (searchInput) {
                    searchInput.value = "";
                    this.clearUsersList();
                }
                // Always prioritize saved section on page load/refresh
                const savedSection = localStorage.getItem("lastActiveSection");
                const urlSection = this.getUrlSection();
                if (savedSection) {
                    console.log("🔄 Restoring saved section:", savedSection);
                    this.showSection(savedSection, false); // Don't update history on initial load
                }
                else if (urlSection) {
                    console.log("🌐 URL section parameter found:", urlSection);
                    this.showSection(urlSection, false); // Don't update history on initial load
                }
                else {
                    console.log("🏠 No saved section, showing home");
                    this.showSection("homeSection", false); // Don't update history on initial load
                }
                return;
            }
            catch (error) {
                console.error("Error parsing stored user data:", error);
                localStorage.removeItem("user");
            }
        }
        // No user data, check if we have a valid authentication cookie
        const hasCookie = document.cookie.includes("token=");
        if (hasCookie) {
            console.log("🍪 Found authentication cookie, verifying...");
            this.verifyTokenAndShowApp();
        }
        else {
            console.log("❌ No authentication found, showing login page");
            this.showPage("loginPage");
        }
    }
    async verifyTokenAndShowApp() {
        try {
            console.log("🔍 Verifying token with server...");
            const response = await fetch(`https://${HOST_IP}/api/auth/getCurrentUser`, {
                method: "GET",
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                console.log("✅ Token verified, user data:", data.user);
                this.currentUser = data.user;
                localStorage.setItem("user", JSON.stringify(data.user));
                this.showPage("mainApp");
                this.loadUserProfile();
                this.updateHomeDashboard();
                // Initialize history state after main app is shown
                this.initializeHistoryState();
                // Show home section by default after Google login
                this.showSection("homeSection", false); // Don't update history on initial load
            }
            else {
                console.log("❌ Token verification failed, status:", response.status);
                // For Google OAuth, we should try to handle this more gracefully
                const urlParams = new URLSearchParams(window.location.search);
                const authParam = urlParams.get('auth');
                if (authParam === 'success') {
                    // If this was a Google OAuth callback but token verification failed,
                    // wait a bit more and try again
                    console.log("🔄 Google OAuth detected, retrying token verification...");
                    setTimeout(() => {
                        this.verifyTokenAndShowApp();
                    }, 1000);
                    return;
                }
                localStorage.removeItem("user");
                this.showPage("loginPage");
            }
        }
        catch (error) {
            console.error("Token verification error:", error);
            // For Google OAuth, be more forgiving of network errors
            const urlParams = new URLSearchParams(window.location.search);
            const authParam = urlParams.get('auth');
            if (authParam === 'success') {
                console.log("🔄 Network error during Google OAuth, retrying...");
                setTimeout(() => {
                    this.verifyTokenAndShowApp();
                }, 2000);
                return;
            }
            localStorage.removeItem("user");
            this.showPage("loginPage");
        }
    }
    async tryRefreshToken() {
        console.log("Attempting to refresh token...");
        try {
            const response = await fetch(`https://${HOST_IP}/api/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                console.log("✅ Token refresh successful");
                // Show the main app with cached data
                this.showPage("mainApp");
                this.updateHomeDashboard();
                this.updateProfileDisplay();
                // Initialize history state after main app is shown
                this.initializeHistoryState();
                // Always prioritize saved section on page load/refresh
                const savedSection = localStorage.getItem("lastActiveSection");
                const urlSection = this.getUrlSection();
                if (savedSection) {
                    console.log("🔄 Restoring saved section after token refresh:", savedSection);
                    this.showSection(savedSection, false); // Don't update history on initial load
                }
                else if (urlSection) {
                    console.log("🌐 URL section parameter found after token refresh:", urlSection);
                    this.showSection(urlSection, false); // Don't update history on initial load
                }
                else {
                    console.log("🏠 No saved section, showing home");
                    this.showSection("homeSection", false); // Don't update history on initial load
                }
            }
            else {
                console.log("❌ Token refresh failed, clearing localStorage");
                localStorage.removeItem("user");
                this.currentUser = null;
                this.showStatus("Session expired. Please login again.", "error");
                setTimeout(() => {
                    this.showPage("registrationPage");
                }, 2000);
            }
        }
        catch (error) {
            console.error("❌ Token refresh error:", error);
            console.log("⚠️ Showing main app anyway with cached data (graceful degradation)");
            // Show the main app with cached data as a fallback
            this.showPage("mainApp");
            this.updateHomeDashboard();
            this.updateProfileDisplay();
            // Initialize history state after main app is shown
            this.initializeHistoryState();
            // Always prioritize saved section on page load/refresh
            const savedSection = localStorage.getItem("lastActiveSection");
            const urlSection = this.getUrlSection();
            if (savedSection) {
                console.log("🔄 Restoring saved section after error:", savedSection);
                this.showSection(savedSection, false); // Don't update history on initial load
            }
            else if (urlSection) {
                console.log("🌐 URL section parameter found after error:", urlSection);
                this.showSection(urlSection, false); // Don't update history on initial load
            }
            else {
                console.log("🏠 No saved section, showing home");
                this.showSection("homeSection", false); // Don't update history on initial load
            }
        }
    }
    async handleLogout() {
        try {
            // Call the logout endpoint to clear the server-side cookie
            await fetch(`https://${HOST_IP}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        this.currentUser = null;
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
    getUrlSection() {
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        if (section) {
            // Map URL parameter to section ID
            switch (section) {
                case 'friends':
                    return 'friendsSection';
                case 'profile':
                    return 'profileSection';
                case 'home':
                    return 'homeSection';
                default:
                    console.log('Unknown section parameter:', section);
                    return null;
            }
        }
        return null;
    }
    showSection(sectionId, updateHistory = true) {
        console.log(`🎯 showSection called with: ${sectionId}, updateHistory: ${updateHistory}`);
<<<<<<< HEAD
        // Check if we're leaving the game section and clean up
        const currentSection = this.getCurrentSectionFromUrl();
        if (currentSection === 'game' && sectionId !== 'gameSection') {
            console.log('🎯 Leaving game section, cleaning up...');
            this.cleanupGameState();
        }
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log(`✅ Switched to section: ${sectionId}`);
            // Update main app background based on active section
            const mainApp = document.getElementById('mainApp');
            if (mainApp) {
                // Remove all background classes
                mainApp.classList.remove('bg-home', 'bg-friends', 'bg-profile', 'bg-dashboard', 'bg-game-options');
                // Add appropriate background class based on section
                switch (sectionId) {
                    case 'homeSection':
                        mainApp.classList.add('bg-home');
                        break;
                    case 'friendsSection':
                        mainApp.classList.add('bg-friends');
                        break;
                    case 'profileSection':
                        mainApp.classList.add('bg-profile');
                        break;
                    case 'dashboardSection':
                        mainApp.classList.add('bg-dashboard');
                        break;
                    case 'gameSection':
                    case 'onlineGameSection':
                    case 'aiPongSection':
                        mainApp.classList.add('bg-game-options');
                        break;
<<<<<<< HEAD
                    case 'localTournamentSection':
                        mainApp.classList.add('bg-game-options');
                        // Ensure tournament is properly reset when showing tournament section
                        if (this.currentTournamentMatch === null) {
                            console.log('Resetting tournament UI when showing tournament section...');
                            this.resetTournamentState();
                        }
                        break;
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
                    default:
                        mainApp.classList.add('bg-home'); // Default to home background
                }
            }
            // Save the current section to localStorage for persistence
            localStorage.setItem('lastActiveSection', sectionId);
            console.log(`Saved section to localStorage: ${sectionId}`);
            // Update browser history if requested
            if (updateHistory) {
                this.updateBrowserHistory(sectionId);
            }
            // If showing profile section, load fresh data
            if (sectionId === 'profileSection' && this.currentUser) {
                console.log('Profile section shown, loading fresh data...');
                setTimeout(() => {
                    this.loadUserProfile();
                }, 100);
            }
            // If showing home section, update the dashboard
            if (sectionId === 'homeSection' && this.currentUser) {
                console.log('Home section shown, updating dashboard...');
                this.updateHomeDashboard();
                // Also load detailed dashboard data for individual game type stats
                this.loadDashboardData();
            }
            else if (sectionId === 'dashboardSection') {
                console.log('Dashboard section shown, loading dashboard data...');
                // Load dashboard data even if user is not logged in (for demo purposes)
                setTimeout(() => {
                    this.loadDashboardData();
                }, 100);
            }
            else if (sectionId === 'aiPongSection') {
                console.log('AI Pong section shown, initializing AI game...');
                setTimeout(() => {
                    this.initializeAIGame();
                }, 100);
            }
        }
        else {
            console.error(`Section not found: ${sectionId}`);
        }
    }
    /**
     * Set up browser history navigation
     */
    setupBrowserHistory() {
        console.log('🔗 Setting up browser history navigation...');
        // Listen for browser back/forward button clicks
        window.addEventListener('popstate', (event) => {
            console.log('🔙 Browser navigation detected:', event.state);
            this.handleBrowserNavigation(event.state);
        });
        // Initialize history state if none exists
        if (!history.state) {
            const currentSection = this.getCurrentSectionFromUrl() || 'homeSection';
            console.log('🔗 No history state, initializing with section:', currentSection);
            this.replaceBrowserHistory(currentSection);
        }
        console.log('🔗 Browser history setup complete');
    }
    /**
     * Update browser history with new section
     */
    updateBrowserHistory(sectionId) {
        const url = this.getUrlForSection(sectionId);
        const state = { section: sectionId, timestamp: Date.now() };
        console.log(`📝 Updating browser history: ${url}`, state);
        history.pushState(state, '', url);
    }
    /**
     * Replace current browser history entry
     */
    replaceBrowserHistory(sectionId) {
        const url = this.getUrlForSection(sectionId);
        const state = { section: sectionId, timestamp: Date.now() };
        console.log(`🔄 Replacing browser history: ${url}`, state);
        history.replaceState(state, '', url);
    }
    /**
     * Get URL for a section
     */
    getUrlForSection(sectionId) {
        const baseUrl = window.location.origin + window.location.pathname;
        // Map section IDs to URL-friendly names
        const sectionMap = {
            'homeSection': '',
            'friendsSection': 'friends',
            'profileSection': 'profile',
            'dashboardSection': 'dashboard',
            'gameSection': 'game',
            'onlineGameSection': 'online-game',
            'aiPongSection': 'ai-game',
            'localTournamentSection': 'tournament'
        };
        const urlSection = sectionMap[sectionId] || '';
        return urlSection ? `${baseUrl}?section=${urlSection}` : baseUrl;
    }
    /**
     * Get current section from URL
     */
    getCurrentSectionFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const sectionParam = urlParams.get('section');
        if (!sectionParam)
            return null;
        // Map URL parameters back to section IDs
        const urlToSectionMap = {
            'friends': 'friendsSection',
            'profile': 'profileSection',
            'dashboard': 'dashboardSection',
            'game': 'gameSection',
            'online-game': 'onlineGameSection',
            'ai-game': 'aiPongSection',
            'tournament': 'localTournamentSection'
        };
        return urlToSectionMap[sectionParam] || null;
    }
    /**
     * Handle browser navigation events
     */
    handleBrowserNavigation(state) {
        console.log('🔙 Handling browser navigation with state:', state);
<<<<<<< HEAD
        // Check if we're leaving a game section and need to stop the game
        const currentSection = this.getCurrentSectionFromUrl();
        console.log('🔙 Current section from URL:', currentSection);
        // Check if game is currently running
        const gameIsRunning = this.gameLoopInterval !== null;
        const tournamentIsRunning = this.currentTournamentMatch !== null;
        console.log('🔙 Game is running:', gameIsRunning);
        console.log('🔙 Tournament is running:', tournamentIsRunning);
        // Always stop any running game when navigating away from game section
        if (gameIsRunning) {
            console.log('🔙 Game is running, stopping it...');
            // Stop the game loop
            if (this.gameLoopInterval) {
                clearInterval(this.gameLoopInterval);
                this.gameLoopInterval = null;
            }
            // Reset game state
            this.resetGameState();
            // Show power-ups toggle again
            this.showPowerupsToggle('1v1');
        }
        // Always stop tournament when navigating away from game section
        if (tournamentIsRunning) {
            console.log('🔙 Tournament is running, stopping it...');
            // Stop the tournament game
            if (this.gameLoopInterval) {
                clearInterval(this.gameLoopInterval);
                this.gameLoopInterval = null;
            }
            // Reset game state
            this.resetGameState();
            // Clear tournament match reference
            this.currentTournamentMatch = null;
            // Restore original endGame method if it was overridden
            if (this.originalEndGame) {
                this.endGame = this.originalEndGame;
                this.originalEndGame = null;
            }
            // Reset tournament state and UI
            this.resetTournamentState();
            // Show power-ups toggle again
            this.showPowerupsToggle('tournament');
        }
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        if (state && state.section) {
            // Navigate to the section from browser history
            console.log(`🔙 Navigating to section from state: ${state.section}`);
            this.showSection(state.section, false); // Don't update history again
            // Load section-specific data if needed
            this.loadSectionData(state.section);
        }
        else {
            // Fallback to URL parameter or default
            const sectionFromUrl = this.getCurrentSectionFromUrl();
            const targetSection = sectionFromUrl || 'homeSection';
            console.log(`🔙 Navigating to section from URL: ${targetSection}`);
            this.showSection(targetSection, false);
            this.loadSectionData(targetSection);
        }
    }
    /**
     * Load section-specific data
     */
    loadSectionData(sectionId) {
        console.log(`📊 Loading data for section: ${sectionId}`);
        switch (sectionId) {
            case 'friendsSection':
                if (this.currentUser) {
                    this.loadFriendsData();
                }
                break;
            case 'profileSection':
                if (this.currentUser) {
                    this.loadUserProfile();
                }
                break;
            case 'dashboardSection':
                this.loadDashboardData();
                break;
            case 'homeSection':
                if (this.currentUser) {
                    this.updateHomeDashboard();
                    this.loadDashboardData();
                }
                break;
        }
    }
    /**
     * Initialize history state after main app is shown
     */
    initializeHistoryState() {
        console.log('🔗 Initializing history state...');
        // Get the current section from URL or default to home
        const currentSection = this.getCurrentSectionFromUrl() || 'homeSection';
        // Only update history if we're not already on the correct URL
        const expectedUrl = this.getUrlForSection(currentSection);
        if (window.location.href !== expectedUrl) {
            this.replaceBrowserHistory(currentSection);
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
        const navTournament = document.getElementById('navTournament');
        const navFriends = document.getElementById('navFriends');
        const navAnalytics = document.getElementById('navAnalytics');
        const navProfile = document.getElementById('navProfile');
        const navLogout = document.getElementById('navLogout');
        if (navHome) {
            navHome.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('homeSection');
                this.goHome();
            });
        }
        if (navFriends) {
            navFriends.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('friendsSection');
            });
        }
        if (navAnalytics) {
            navAnalytics.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('dashboardSection');
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
        if (navLogout) {
            navLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
        // Colorblind mode toggle - try multiple times to ensure it's found
        this.setupColorblindToggle();
        // Set up periodic refresh of friends list for real-time online status
        // this.setupFriendsRefresh();
    }
    // private setupFriendsRefresh(): void {
    //     // Refresh friends list every 30 seconds to update online status
    //     setInterval(() => {
    //         if (this.currentUser && document.getElementById('friendsSection')?.classList.contains('hidden') === false) {
    //             this.loadFriendsData();
    //         }
    //     }, 30000); // 30 seconds
    // }
    setupDashboardNavigation() {
        // Setup dashboard navigation buttons
        const dashboardNavBtns = document.querySelectorAll('.dashboard-nav-btn[data-section]');
        dashboardNavBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                if (section) {
                    this.showDashboardSection(section);
                }
            });
        });
    }
    showDashboardSection(section) {
        // Hide all dashboard subsections
        const subsections = document.querySelectorAll('.dashboard-subsection');
        subsections.forEach(subsection => {
            subsection.classList.add('hidden');
        });
        // Show the selected subsection
        const targetSubsection = document.getElementById(`dashboard-${section}`);
        if (targetSubsection) {
            targetSubsection.classList.remove('hidden');
        }
        // Update active button
        const navBtns = document.querySelectorAll('.dashboard-nav-btn');
        navBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.dashboard-nav-btn[data-section="${section}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    async loadDashboardData() {
        try {
            console.log('Loading dashboard data...');
            const response = await fetch(`https://${HOST_IP}/api/dashboard/user`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard API response:', data);
                this.renderDashboardData(data);
            }
            else {
                console.error('Failed to load dashboard data:', response.status, response.statusText);
            }
        }
        catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    renderDashboardData(data) {
        if (!data || !data.data)
            return;
        const dashboardData = data.data;
        // Update overview stats
        const overallWinRate = document.getElementById('overall-win-rate');
        const totalGames = document.getElementById('total-games');
        const skillLevel = document.getElementById('skill-level');
        const currentStreak = document.getElementById('current-streak');
        if (overallWinRate)
            overallWinRate.textContent = `${dashboardData.summary.overallWinRate}%`;
        if (totalGames)
            totalGames.textContent = dashboardData.summary.totalGames;
        if (skillLevel)
            skillLevel.textContent = dashboardData.summary.skillLevel.level;
        if (currentStreak)
            currentStreak.textContent = '3'; // Would come from actual data
        // Update AI games stats
        const aiGamesWon = document.getElementById('ai-games-won');
        const aiWinRate = document.getElementById('ai-win-rate');
        const aiBestScore = document.getElementById('ai-best-score');
        const aiAvgScore = document.getElementById('ai-avg-score');
        if (aiGamesWon)
            aiGamesWon.textContent = dashboardData.aiGameStats.wins;
        if (aiWinRate)
            aiWinRate.textContent = `${dashboardData.aiGameStats.winRate}%`;
        if (aiBestScore)
            aiBestScore.textContent = dashboardData.aiGameStats.bestScore;
        if (aiAvgScore)
            aiAvgScore.textContent = dashboardData.aiGameStats.averageScore;
        // Update Local games stats (SPA dashboard)
        const localGamesWon = document.getElementById('local-games-won');
        const localWinRate = document.getElementById('local-win-rate');
        const localBestScore = document.getElementById('local-best-score');
        const localAvgScore = document.getElementById('local-avg-score');
        if (localGamesWon)
            localGamesWon.textContent = (dashboardData.localGameStats?.wins ?? 0).toString();
        if (localWinRate)
            localWinRate.textContent = `${dashboardData.localGameStats?.winRate ?? 0}%`;
        if (localBestScore)
            localBestScore.textContent = (dashboardData.localGameStats?.bestScore ?? 0).toString();
        if (localAvgScore)
            localAvgScore.textContent = (dashboardData.localGameStats?.averageScore ?? 0).toString();
        // Update multiplayer stats
        const mpWins = document.getElementById('mp-wins');
        const mpWinRate = document.getElementById('mp-win-rate');
        const bestOpponent = document.getElementById('best-opponent');
        const mpTotal = document.getElementById('mp-total');
        if (mpWins)
            mpWins.textContent = (dashboardData.multiplayerStats?.wins ?? 0).toString();
        if (mpWinRate)
            mpWinRate.textContent = `${dashboardData.multiplayerStats?.winRate ?? 0}%`;
        if (bestOpponent)
            bestOpponent.textContent = '—';
        if (mpTotal)
            mpTotal.textContent = (dashboardData.multiplayerStats?.totalGames ?? 0).toString();
        // Update tournament stats
        const tournamentsWon = document.getElementById('tournaments-won');
        const tournamentWinRate = document.getElementById('tournament-win-rate');
        const bestFinish = document.getElementById('best-finish');
        const tournamentMatches = document.getElementById('tournament-matches');
        if (tournamentsWon)
            tournamentsWon.textContent = (dashboardData.tournamentStats?.wins ?? 0).toString();
        if (tournamentWinRate)
            tournamentWinRate.textContent = `${dashboardData.tournamentStats?.winRate ?? 0}%`;
        if (bestFinish)
            bestFinish.textContent = '—';
        if (tournamentMatches)
            tournamentMatches.textContent = (dashboardData.tournamentStats?.totalGames ?? 0).toString();
        // Update home page individual game type stats
        this.updateHomeGameTypeStats(dashboardData);
        // Render recent games
        this.renderRecentGames(dashboardData.recentGames);
        // Render achievements
        this.renderAchievements(dashboardData.achievements);
    }
    updateHomeGameTypeStats(dashboardData) {
        console.log('=== UPDATE HOME GAME TYPE STATS ===');
        console.log('Dashboard data received:', dashboardData);
        console.log('AI Game Stats:', dashboardData.aiGameStats);
        console.log('Local Game Stats:', dashboardData.localGameStats);
        console.log('Remote Game Stats:', dashboardData.multiplayerStats);
        console.log('Tournament Stats:', dashboardData.tournamentStats);
        // Update AI Games stats on home page
        const homeAIGames = document.getElementById('homeAIGames');
        const homeAIWins = document.getElementById('homeAIWins');
        const homeAIWinRate = document.getElementById('homeAIWinRate');
        if (homeAIGames)
            homeAIGames.textContent = dashboardData.aiGameStats?.totalGames || '0';
        if (homeAIWins)
            homeAIWins.textContent = dashboardData.aiGameStats?.wins || '0';
        if (homeAIWinRate)
            homeAIWinRate.textContent = `${dashboardData.aiGameStats?.winRate || 0}%`;
        // Update Local Games stats on home page
        const homeLocalGames = document.getElementById('homeLocalGames');
        const homeLocalWins = document.getElementById('homeLocalWins');
        const homeLocalWinRate = document.getElementById('homeLocalWinRate');
        if (homeLocalGames)
            homeLocalGames.textContent = dashboardData.localGameStats?.totalGames || '0';
        if (homeLocalWins)
            homeLocalWins.textContent = dashboardData.localGameStats?.wins || '0';
        if (homeLocalWinRate)
            homeLocalWinRate.textContent = `${dashboardData.localGameStats?.winRate || 0}%`;
        // Update Remote Game stats on home page
        const homeMPGames = document.getElementById('homeMPGames');
        const homeMPWins = document.getElementById('homeMPWins');
        const homeMPWinRate = document.getElementById('homeMPWinRate');
        if (homeMPGames)
            homeMPGames.textContent = dashboardData.multiplayerStats?.totalGames || '0';
        if (homeMPWins)
            homeMPWins.textContent = dashboardData.multiplayerStats?.wins || '0';
        if (homeMPWinRate)
            homeMPWinRate.textContent = `${dashboardData.multiplayerStats?.winRate || 0}%`;
        // Update Tournament stats on home page
        const homeTournamentGames = document.getElementById('homeTournamentGames');
        const homeTournamentWins = document.getElementById('homeTournamentWins');
        const homeTournamentWinRate = document.getElementById('homeTournamentWinRate');
        if (homeTournamentGames)
            homeTournamentGames.textContent = dashboardData.tournamentStats?.totalGames || '0';
        if (homeTournamentWins)
            homeTournamentWins.textContent = dashboardData.tournamentStats?.wins || '0';
        if (homeTournamentWinRate)
            homeTournamentWinRate.textContent = `${dashboardData.tournamentStats?.winRate || 0}%`;
        console.log('Updated home page game type stats:', {
            aiGames: dashboardData.aiGameStats,
            localGames: dashboardData.localGameStats,
            multiplayer: dashboardData.multiplayerStats,
            tournament: dashboardData.tournamentStats
        });
    }
    renderRecentGames(games) {
        const container = document.getElementById('recent-games-list');
        if (!container)
            return;
        if (!games || games.length === 0) {
            container.innerHTML = '<div class="text-center text-white">No recent games found</div>';
            return;
        }
        container.innerHTML = games.map(game => `
            <div class="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${game.result === 'WIN' ? 'bg-green-500' : 'bg-red-500'}">
                        <span class="text-white font-bold">${game.result === 'WIN' ? 'W' : 'L'}</span>
                    </div>
                    <div>
                        <div class="text-white font-semibold">${game.type || 'Game'}</div>
                        <div class="text-gray-300 text-sm">${game.opponent || 'Winner: AI'}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-white font-bold">${game.score}</div>
                    <div class="text-gray-400 text-sm">${game.date ? new Date(game.date).toLocaleDateString() : 'Unknown'}</div>
                    <div class="text-gray-500 text-xs">Game Duration: ${game.duration || 'N/A'}</div>
                </div>
            </div>
        `).join('');
    }
    renderAchievements(achievements) {
        const container = document.getElementById('achievements-grid');
        if (!container)
            return;
        if (!achievements || achievements.length === 0) {
            container.innerHTML = '<div class="text-center text-white py-8">Loading achievements...</div>';
            return;
        }
        // Group achievements by category with better organization
        const categories = {
            milestone: { name: 'Milestones', icon: '🏆', achievements: [] },
            game_type: { name: 'Game Types', icon: '🎮', achievements: [] },
            performance: { name: 'Performance', icon: '📊', achievements: [] },
            variety: { name: 'Variety', icon: '🎯', achievements: [] },
            activity: { name: 'Activity', icon: '🏃‍♂️', achievements: [] },
            special: { name: 'Special', icon: '✨', achievements: [] }
        };
        achievements.forEach((achievement) => {
            if (categories[achievement.category]) {
                categories[achievement.category].achievements.push(achievement);
            }
        });
        container.innerHTML = Object.values(categories).map(category => {
            if (category.achievements.length === 0)
                return '';
            const unlockedCount = category.achievements.filter(a => a.unlocked).length;
            const totalCount = category.achievements.length;
            return `
                <div class="mb-10">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">${category.icon}</span>
                            <h3 class="text-xl font-bold text-white">${category.name}</h3>
                        </div>
                        <div class="text-sm text-gray-400">
                            ${unlockedCount}/${totalCount} unlocked
                        </div>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        ${category.achievements.map(achievement => `
                            <div class="group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] ${achievement.unlocked
                ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 shadow-lg shadow-yellow-500/10'
                : 'border-gray-600/50 bg-gray-800/30 hover:border-gray-500/50'}">
                                <div class="p-5">
                                    <div class="text-center">
                                        <div class="mb-4">
                                            <div class="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-3xl transition-all duration-300 ${achievement.unlocked
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/25'
                : 'bg-gray-700 group-hover:bg-gray-600'}">
                                                ${achievement.icon}
                                            </div>
                                        </div>
                                        <div class="space-y-3">
                                            <div class="flex items-center justify-center gap-2">
                                                <h4 class="text-white font-semibold text-lg">${achievement.name}</h4>
                                                ${achievement.unlocked ? '<span class="text-yellow-400 text-lg">✓</span>' : ''}
                                            </div>
                                            <p class="text-gray-300 text-sm leading-relaxed">${achievement.description}</p>
                                            <div class="text-xs text-gray-400 font-medium">Requirement: ${achievement.requirement}</div>
                                            
                                            ${!achievement.unlocked ? `
                                                <div class="space-y-2">
                                                    <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                        <div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-700 ease-out" 
                                                             style="width: ${Math.round(achievement.progress)}%"></div>
                                                    </div>
                                                    <div class="flex justify-between items-center">
                                                        <span class="text-xs text-gray-400">Progress</span>
                                                        <span class="text-xs font-semibold text-gray-300">${Math.round(achievement.progress)}%</span>
                                                    </div>
                                                </div>
                                            ` : `
                                                <div class="flex items-center justify-center gap-2">
                                                    <span class="text-xs font-bold text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full">UNLOCKED!</span>
                                                    <span class="text-xs text-gray-400">Completed</span>
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                </div>
                                ${achievement.unlocked ? `
                                    <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-bl-full"></div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }
    setupGameOptions() {
        // Add click handlers for game options
        const gameOptions = document.querySelectorAll('[data-game-type]');
        console.log('Found game options:', gameOptions.length);
        gameOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const gameType = e.currentTarget.getAttribute('data-game-type');
                console.log('🎯 Game option clicked:', gameType);
                console.log('🎯 Element:', e.currentTarget);
                console.log('🎯 All data attributes:', e.currentTarget.attributes);
                this.handleGameSelection(gameType || '1v1');
            });
        });
    }
    async handleGameSelection(gameType) {
        console.log('🎮 handleGameSelection called with gameType:', gameType);
        if (!this.currentUser) {
            this.showStatus('Please log in to play games', 'error');
            return;
        }
        // Check authentication before proceeding
        try {
            const response = await fetch(`https://${HOST_IP}/api/profile/me`, {
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
        }
        catch (error) {
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
        }
        else if (gameType === '1vAI') {
            // AI games don't require authentication
            console.log('AI game selected, navigating to AI pong section...');
            this.showSection('aiPongSection');
            setTimeout(() => {
                this.initializeAIGameCanvas();
                this.setupAIGameEventListeners();
            }, 100); // Small delay to ensure DOM is ready
            return;
        }
        else if (gameType === 'tournament') {
            // Redirect to tournament section
            this.showSection('localTournamentSection');
            console.log('Tournament section shown');
<<<<<<< HEAD
            // Ensure tournament is properly reset when returning to section
            if (this.currentTournamentMatch === null) {
                console.log('Ensuring tournament UI is reset...');
                this.resetTournamentState();
            }
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        }
        else if (gameType === 'online') {
            // Redirect to online game section for direct remote connection
            this.showSection('onlineGameSection');
            console.log('Remote game section shown, initializing direct connection...');
            setTimeout(() => {
                this.initializeRemoteGame();
            }, 100); // Small delay to ensure DOM is ready
        }
        else if (gameType === 'remote') {
            // Redirect to online game section for remote game
            this.showSection('onlineGameSection');
            console.log('Remote game section shown, initializing remote game...');
            setTimeout(() => {
                this.initializeRemoteGame();
            }, 100); // Small delay to ensure DOM is ready
        }
        else {
            // For other game types, show a message for now
            this.showStatus(`${gameType} game coming soon!`, 'success');
        }
        console.log('Game selection:', gameType);
    }
    initializeGame() {
        console.log('=== INITIALIZING GAME ===');
        // Set up the game canvas and controls
        const canvas = document.getElementById('gameCanvas');
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
        // Preload paddle hit sound, score sound, and end game sound
        try {
            this.paddleHitAudio = new Audio('/imgs/Ping-pong-ball-bouncing.mp3');
            this.paddleHitAudio.preload = 'auto';
            this.scoreAudio = new Audio('/imgs/point-smooth-beep-230573.mp3');
            this.scoreAudio.preload = 'auto';
            this.endGameAudio = new Audio('/imgs/077512_end-game-90582.mp3');
            this.endGameAudio.preload = 'auto';
            // Attempt to unlock on first user interaction
            const unlock = () => {
                if (!this.paddleHitAudio || !this.scoreAudio || !this.endGameAudio)
                    return;
                this.paddleHitAudio.muted = true;
                this.scoreAudio.muted = true;
                this.endGameAudio.muted = true;
                this.paddleHitAudio.play().catch(() => { });
                this.scoreAudio.play().catch(() => { });
                this.endGameAudio.play().catch(() => { });
                this.paddleHitAudio.pause();
                this.scoreAudio.pause();
                this.endGameAudio.pause();
                this.paddleHitAudio.currentTime = 0;
                this.scoreAudio.currentTime = 0;
                this.endGameAudio.currentTime = 0;
                this.paddleHitAudio.muted = false;
                this.scoreAudio.muted = false;
                this.endGameAudio.muted = false;
                window.removeEventListener('click', unlock);
                window.removeEventListener('touchstart', unlock);
            };
            window.addEventListener('click', unlock, { once: true });
            window.addEventListener('touchstart', unlock, { once: true });
        }
        catch (e) {
            console.warn('Audio initialization failed', e);
        }
        // Reset game state completely
        this.resetGameState();
        // Set player names
        player1Name.textContent = this.currentUser.username || 'Player 1';
        player2Name.textContent = 'Local Player';
        // Reset scores to game state values
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        if (player1Score)
            player1Score.textContent = this.gameState?.scorePlayer1?.toString() || '0';
        if (player2Score)
            player2Score.textContent = this.gameState?.scorePlayer2?.toString() || '0';
        // Show game overlay with start button
        gameOverlay.style.display = 'flex';
        console.log('Game overlay display set to:', gameOverlay.style.display);
        gameMessage.textContent = '';
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
            console.log('Game overlay:', gameOverlay);
            console.log('Game state before start:', this.gameState);
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
    resetGameState() {
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
            gameOver: false,
            player1Keys: { up: false, down: false },
            player2Keys: { up: false, down: false },
            // Serve logic
            currentServer: Math.random() < 0.5 ? 1 : 2,
            servesLeftForServer: 2,
            // Power-ups (simplified: squares that add points, max 2 per game)
            powerUps: [],
            powerUpSpawnTimer: 0,
            powerUpsSpawned: 0,
            maxPowerUpsPerGame: 2,
            leftPaddleBuffUntil: 0,
<<<<<<< HEAD
            rightPaddleBuffUntil: 0,
            powerupsEnabled: true // Default to enabled, toggle will update this
=======
            rightPaddleBuffUntil: 0
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        };
        // Clear any existing game loop
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
<<<<<<< HEAD
        // Show power-ups toggle when game is reset
        this.showPowerupsToggle('1v1');
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
    }
    setupGameControls() {
        // Remove existing listeners to prevent duplicates
        document.removeEventListener('keydown', this.handleGameKeyDown);
        document.removeEventListener('keyup', this.handleGameKeyUp);
        // Add new listeners
        document.addEventListener('keydown', this.handleGameKeyDown.bind(this));
        document.addEventListener('keyup', this.handleGameKeyUp.bind(this));
        // Add tournament leave detection
        this.setupTournamentLeaveDetection();
    }
    setupTournamentLeaveDetection() {
        // Add beforeunload event to detect when player leaves the page
        window.addEventListener('beforeunload', (event) => {
            if (this.currentTournamentMatch && this.gameLoopInterval) {
                console.log('Player leaving tournament page');
                // This will trigger when the page is being unloaded
                // We can't prevent the navigation, but we can log it
            }
        });
        // Add visibility change detection
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.currentTournamentMatch && this.gameLoopInterval) {
                console.log('Player left tournament (page hidden)');
                // Handle as if the current user left
                if (this.currentUser) {
                    this.handleTournamentPlayerLeave(this.currentUser.username);
                }
            }
        });
    }
    handleGameKeyDown(event) {
        if (!this.gameState)
            return;
        switch (event.key.toLowerCase()) {
            case 'w':
                this.gameState.player1Keys.up = true;
                event.preventDefault();
                break;
            case 's':
                this.gameState.player1Keys.down = true;
                event.preventDefault();
                break;
            case 'arrowup':
                this.gameState.player2Keys.up = true;
                event.preventDefault();
                break;
            case 'arrowdown':
                this.gameState.player2Keys.down = true;
                event.preventDefault();
                break;
        }
    }
    handleGameKeyUp(event) {
        if (!this.gameState)
            return;
        switch (event.key.toLowerCase()) {
            case 'w':
                this.gameState.player1Keys.up = false;
                event.preventDefault();
                break;
            case 's':
                this.gameState.player1Keys.down = false;
                event.preventDefault();
                break;
            case 'arrowup':
                this.gameState.player2Keys.up = false;
                event.preventDefault();
                break;
            case 'arrowdown':
                this.gameState.player2Keys.down = false;
                event.preventDefault();
                break;
        }
    }
    startLocalGame() {
        // Reset game state completely
        this.resetGameState();
        // Record game start time
        this.localGameStartTime = new Date();
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
            leftPaddleHeight: 100,
            rightPaddleHeight: 100,
            canvasWidth: 800,
            scorePlayer1: 0,
            scorePlayer2: 0,
            maxScore: 5,
            player1Keys: { up: false, down: false },
            player2Keys: { up: false, down: false },
            // Serve logic
            currentServer: Math.random() < 0.5 ? 1 : 2,
            servesLeftForServer: 2,
            // Power-ups (simplified: squares that add points, max 2 per game)
            powerUps: [],
            powerUpSpawnTimer: 0,
            powerUpsSpawned: 0,
            maxPowerUpsPerGame: 2,
            leftPaddleBuffUntil: 0,
            rightPaddleBuffUntil: 0
        };
        // Set initial serve direction from currentServer
        this.setServeDirection();
        // Update score display to reflect reset scores
        this.updateScoreDisplay();
        // Hide the start button when game starts
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.style.display = 'none';
            console.log('Start button hidden');
        }
        else {
            console.log('Start button not found!');
        }
<<<<<<< HEAD
        // Hide power-ups toggle when game starts
        this.hidePowerupsToggle('1v1');
        // Set powerupsEnabled based on toggle state
        console.log('=== GAME START DEBUG ===');
        console.log('gameState exists:', !!this.gameState);
        console.log('powerupsEnabled BEFORE setting:', this.gameState?.powerupsEnabled);
        if (this.gameState) {
            const toggle1v1 = document.getElementById('powerupsToggle1v1');
            const enabled = toggle1v1 ? toggle1v1.checked : true; // Default to true if toggle not found
            this.gameState.powerupsEnabled = enabled;
            console.log('Set powerupsEnabled based on 1v1 toggle:', enabled);
        }
        console.log('powerupsEnabled AFTER setting:', this.gameState?.powerupsEnabled);
        console.log('powerUpsSpawned:', this.gameState?.powerUpsSpawned);
        console.log('maxPowerUpsPerGame:', this.gameState?.maxPowerUpsPerGame);
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        // Keep customize button visible during gameplay
        const customizeBtn = document.getElementById('customizeBtn');
        if (customizeBtn) {
            customizeBtn.style.display = 'block';
        }
        // Hide game overlay
        const gameOverlay = document.getElementById('gameOverlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
            console.log('Game overlay hidden');
        }
        else {
            console.log('Game overlay not found!');
        }
        // Start game loop
        this.gameLoopInterval = setInterval(() => {
            this.updateGame();
        }, 16); // ~60 FPS
    }
    updateGame() {
        if (!this.gameState)
            return;
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
            console.log('Player 2 scored! Previous score:', this.gameState.scorePlayer2);
            this.gameState.scorePlayer2++;
            this.playScoreSound();
            this.resetBall();
            this.updateScoreDisplay();
            this.advanceServeAfterPoint(2);
            if (this.gameState.scorePlayer2 >= this.gameState.maxScore) {
                this.gameState.gameOver = true;
                this.endGame(2);
                return;
            }
        }
        // Ball collision with right wall (Player 1 scores)
        if (this.gameState.ballPositionX + this.gameState.radius >= this.gameState.canvasWidth) {
            console.log('Player 1 scored! Previous score:', this.gameState.scorePlayer1);
            this.gameState.scorePlayer1++;
            this.playScoreSound();
            this.resetBall();
            this.updateScoreDisplay();
            this.advanceServeAfterPoint(1);
            if (this.gameState.scorePlayer1 >= this.gameState.maxScore) {
                this.gameState.gameOver = true;
                this.endGame(1);
                return;
            }
        }
        // Check paddle collisions
        this.checkPaddleCollisions();
        // Check power-ups (improved system: ball collision, duration, scoring)
        this.updatePowerUps();
        // Draw the game
        this.drawGame();
    }
    updatePaddlePositions() {
        const paddleSpeed = 8;
        // Player 1 (W/S keys)
        if (this.gameState.player1Keys.up) {
            this.gameState.leftPaddleY = Math.max(0, this.gameState.leftPaddleY - paddleSpeed);
        }
        if (this.gameState.player1Keys.down) {
            this.gameState.leftPaddleY = Math.min(this.gameState.canvasHeight - this.gameState.paddleHeight, this.gameState.leftPaddleY + paddleSpeed);
        }
        // Player 2 (Arrow keys)
        if (this.gameState.player2Keys.up) {
            this.gameState.rightPaddleY = Math.max(0, this.gameState.rightPaddleY - paddleSpeed);
        }
        if (this.gameState.player2Keys.down) {
            this.gameState.rightPaddleY = Math.min(this.gameState.canvasHeight - this.gameState.paddleHeight, this.gameState.rightPaddleY + paddleSpeed);
        }
    }
    checkPaddleCollisions() {
        // Store previous position for continuous collision detection
        const prevX = this.gameState.ballPositionX - this.gameState.speedX;
        const prevY = this.gameState.ballPositionY - this.gameState.speedY;
        // Left paddle collision - check if ball crossed the paddle plane
        const leftPaddleRightEdge = this.gameState.leftPaddleX + this.gameState.paddleWidth;
        const leftPaddleLeftEdge = this.gameState.leftPaddleX;
        const ballLeftEdge = this.gameState.ballPositionX - this.gameState.radius;
        const ballRightEdge = this.gameState.ballPositionX + this.gameState.radius;
        // Check if ball is moving left and crossed the paddle plane
        if (this.gameState.speedX < 0 &&
            prevX > leftPaddleRightEdge && ballLeftEdge <= leftPaddleRightEdge &&
            this.gameState.ballPositionY >= this.gameState.leftPaddleY &&
            this.gameState.ballPositionY <= this.gameState.leftPaddleY + this.gameState.paddleHeight) {
            // Clamp ball to paddle surface to prevent tunneling
            this.gameState.ballPositionX = leftPaddleRightEdge + this.gameState.radius;
            this.gameState.speedX = Math.abs(this.gameState.speedX);
            // Additional safety: ensure ball is not behind paddle
            if (this.gameState.ballPositionX < leftPaddleRightEdge) {
                this.gameState.ballPositionX = leftPaddleRightEdge + this.gameState.radius + 1;
            }
            this.addSpin();
            this.playPaddleHit();
        }
        // Right paddle collision - check if ball crossed the paddle plane
        const rightPaddleLeftEdge = this.gameState.rightPaddleX;
        const rightPaddleRightEdge = this.gameState.rightPaddleX + this.gameState.paddleWidth;
        // Check if ball is moving right and crossed the paddle plane
        if (this.gameState.speedX > 0 &&
            prevX < rightPaddleLeftEdge && ballRightEdge >= rightPaddleLeftEdge &&
            this.gameState.ballPositionY >= this.gameState.rightPaddleY &&
            this.gameState.ballPositionY <= this.gameState.rightPaddleY + this.gameState.paddleHeight) {
            // Clamp ball to paddle surface to prevent tunneling
            this.gameState.ballPositionX = rightPaddleLeftEdge - this.gameState.radius;
            this.gameState.speedX = -Math.abs(this.gameState.speedX);
            // Additional safety: ensure ball is not behind paddle
            if (this.gameState.ballPositionX > rightPaddleLeftEdge) {
                this.gameState.ballPositionX = rightPaddleLeftEdge - this.gameState.radius - 1;
            }
            this.addSpin();
            this.playPaddleHit();
        }
    }
    updatePowerUps() {
<<<<<<< HEAD
        // Debug: Log power-ups state occasionally
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
            console.log('updatePowerUps called - powerupsEnabled:', this.gameState.powerupsEnabled, 'powerUpsSpawned:', this.gameState.powerUpsSpawned, 'activePowerUps:', this.gameState.powerUps.length);
        }
        // Check if power-ups are enabled
        if (!this.gameState.powerupsEnabled) {
            // Debug: Log when power-ups are disabled
            if (Math.random() < 0.01) { // Log occasionally to avoid spam
                console.log('Power-ups are disabled, skipping update');
            }
            return;
        }
        // Spawn power-ups (max 2 per game total)
        if (this.gameState.powerUpsSpawned < this.gameState.maxPowerUpsPerGame &&
            this.gameState.powerUps.length === 0 &&
            Math.random() < 0.1) { // Increased spawn rate from 5% to 10%
=======
        // Spawn power-ups (max 2 per game total)
        if (this.gameState.powerUpsSpawned < this.gameState.maxPowerUpsPerGame &&
            this.gameState.powerUps.length === 0 &&
            Math.random() < 0.05) {
>>>>>>> parent of 5650101 (addition of oauth (fully working))
            console.log(`Attempting to spawn power-up ${this.gameState.powerUpsSpawned + 1}/${this.gameState.maxPowerUpsPerGame}`);
            this.spawnPowerUp();
        }
        // Debug: Log power-up status
        if (this.gameState.powerUps.length > 0 && Math.random() < 0.1) {
            console.log(`Active power-ups: ${this.gameState.powerUps.length}, Spawned: ${this.gameState.powerUpsSpawned}/${this.gameState.maxPowerUpsPerGame}`);
        }
        // Update existing power-ups (decrease duration, remove expired)
        this.gameState.powerUps = this.gameState.powerUps.filter((powerUp) => {
            powerUp.duration--;
            return powerUp.duration > 0;
        });
        // Check ball collision with power-ups
        this.gameState.powerUps.forEach((powerUp, index) => {
            const ballX = this.gameState.ballPositionX;
            const ballY = this.gameState.ballPositionY;
            const ballRadius = this.gameState.radius;
            // Debug logging
            if (Math.random() < 0.01) { // Log occasionally to avoid spam
                console.log(`Ball: (${ballX}, ${ballY}), Power-up: (${powerUp.x}, ${powerUp.y}), Size: ${powerUp.width}x${powerUp.height}`);
            }
            if (ballX + ballRadius > powerUp.x &&
                ballX - ballRadius < powerUp.x + powerUp.width &&
                ballY + ballRadius > powerUp.y &&
                ballY - ballRadius < powerUp.y + powerUp.height) {
                console.log('COLLISION DETECTED!');
                // Determine which player gets the point based on ball direction
                // If ball is moving right (positive speedX), Player 1 gets the point
                // If ball is moving left (negative speedX), Player 2 gets the point
                const player1GetsPoint = this.gameState.speedX > 0;
                if (player1GetsPoint) {
                    this.gameState.scorePlayer1++;
                    console.log('Player 1 gets the point!');
                }
                else {
                    this.gameState.scorePlayer2++;
                    console.log('Player 2 gets the point!');
                }
                this.playScoreSound();
                this.updateScoreDisplay();
                // Remove power-up
                this.gameState.powerUps.splice(index, 1);
                console.log(`Power-up collected! Player ${player1GetsPoint ? '1' : '2'} gets a point!`);
            }
        });
    }
    spawnPowerUp() {
        const powerUp = {
            x: Math.random() * (this.gameState.canvasWidth - 30),
            y: Math.random() * (this.gameState.canvasHeight - 30),
            width: 25,
            height: 25,
            speedX: 0,
            speedY: 0,
            type: 'point',
            active: true,
            duration: 600 // 10 seconds at 60fps
        };
        this.gameState.powerUps.push(powerUp);
        this.gameState.powerUpsSpawned++;
        console.log(`Spawned power-up square at (${powerUp.x}, ${powerUp.y}) - ${this.gameState.powerUpsSpawned}/${this.gameState.maxPowerUpsPerGame}`);
    }
    advanceServeAfterPoint(scoredPlayer) {
        // Decrement serves left for current server; switch after two serves
        if (this.gameState.servesLeftForServer > 1) {
            this.gameState.servesLeftForServer -= 1;
        }
        else {
            this.gameState.currentServer = this.gameState.currentServer === 1 ? 2 : 1;
            this.gameState.servesLeftForServer = 2;
        }
    }
    playPaddleHit() {
        if (!this.paddleHitAudio)
            return;
        try {
            this.paddleHitAudio.currentTime = 0;
            void this.paddleHitAudio.play();
        }
        catch { }
    }
    playScoreSound() {
        if (!this.scoreAudio)
            return;
        try {
            this.scoreAudio.currentTime = 0;
            void this.scoreAudio.play();
        }
        catch { }
    }
    playEndGameSound() {
        if (!this.endGameAudio)
            return;
        try {
            this.endGameAudio.currentTime = 0;
            void this.endGameAudio.play();
        }
        catch { }
    }
    addSpin() {
        const spin = (Math.random() - 0.5) * 2;
        this.gameState.speedY += spin;
        // Keep speed within reasonable bounds
        this.gameState.speedY = Math.max(-8, Math.min(8, this.gameState.speedY));
    }
    resetBall() {
        this.gameState.ballPositionX = this.gameState.canvasWidth / 2;
        this.gameState.ballPositionY = this.gameState.canvasHeight / 2;
        // Serve direction depends on current server (1 = left player serves right, 2 = right player serves left)
        this.gameState.speedX = this.gameState.currentServer === 1 ? 5 : -5;
        this.gameState.speedY = (Math.random() - 0.5) * 6;
    }
    setServeDirection() {
        this.gameState.speedX = this.gameState.currentServer === 1 ? 5 : -5;
        this.gameState.speedY = (Math.random() - 0.5) * 6;
    }
    updateScoreDisplay() {
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        if (player1Score)
            player1Score.textContent = this.gameState.scorePlayer1.toString();
        if (player2Score)
            player2Score.textContent = this.gameState.scorePlayer2.toString();
    }
    showCustomizationModal() {
        const modal = document.getElementById('customizeModal');
        if (modal) {
            modal.style.display = 'flex';
            this.setupColorOptions();
        }
    }
    hideCustomizationModal() {
        const modal = document.getElementById('customizeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    setupColorOptions() {
        // Setup color option click handlers
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const color = target.getAttribute('data-color');
                const type = target.getAttribute('data-type');
                if (color && type) {
                    if (type === 'table') {
                        this.customizationSettings.tableColor = color;
                    }
                    else if (type === 'paddle') {
                        // For paddle colors, set both my paddle and opponent paddle to the same color
                        this.customizationSettings.myPaddleColor = color;
                        this.customizationSettings.opponentPaddleColor = color;
                    }
                    // Update the game display
                    this.drawGame();
                    // Also update remote game if active
                    if (this.onlineGameState.isConnected) {
                        this.drawRemoteGame();
                    }
                    // Also update AI game if active
                    if (this.aiGameAnimationId) {
                        this.drawAIGame();
                    }
                    else {
                        // If AI game is not running, just update background
                        this.drawAIGameBackground();
                    }
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
    drawGame() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        if (!canvas || !ctx || !this.gameState)
            return;
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
        ctx.fillStyle = this.customizationSettings.myPaddleColor;
        const lpH = this.gameState.leftPaddleBuffUntil > Date.now() ? (this.gameState.leftPaddleHeight || this.gameState.paddleHeight) : this.gameState.paddleHeight;
        const rpH = this.gameState.rightPaddleBuffUntil > Date.now() ? (this.gameState.rightPaddleHeight || this.gameState.paddleHeight) : this.gameState.paddleHeight;
        ctx.fillRect(this.gameState.leftPaddleX, this.gameState.leftPaddleY, this.gameState.paddleWidth, lpH);
        ctx.fillStyle = this.customizationSettings.opponentPaddleColor;
        ctx.fillRect(this.gameState.rightPaddleX, this.gameState.rightPaddleY, this.gameState.paddleWidth, rpH);
        // Draw ball
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(this.gameState.ballPositionX, this.gameState.ballPositionY, this.gameState.radius, 0, Math.PI * 2);
        ctx.fill();
        // Draw power-ups (improved system)
<<<<<<< HEAD
        if (this.gameState.powerUps.length > 0 && Math.random() < 0.01) {
            console.log('Drawing power-ups:', this.gameState.powerUps.length, 'power-ups');
        }
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        this.gameState.powerUps.forEach((powerUp) => {
            // Draw square power-up with Powerpuff colors
            const colors = ['#FF69B4', '#87CEEB', '#98FB98']; // Pink, Blue, Green
            const color = colors[this.gameState.powerUpsSpawned % colors.length];
            ctx.save();
            ctx.fillStyle = color;
            ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            // Add sparkle effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(powerUp.x + 3, powerUp.y + 3, powerUp.width - 6, powerUp.height - 6);
            // Add border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            ctx.restore();
        });
    }
    async endGame(winner) {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        this.playEndGameSound();
        // Update stats immediately when game ends
        if (this.currentUser) {
            console.log('Updating stats immediately for game end');
            const gameDuration = this.localGameStartTime ? new Date().getTime() - this.localGameStartTime.getTime() : 60000; // Default to 1 minute if no start time
            await this.updateUserStats(winner === 1, 'LOCAL', this.gameState.scorePlayer1, this.gameState.scorePlayer2, gameDuration);
        }
        // Show the game over modal
        const gameOverModal = document.getElementById('gameOverModal');
        const gameOverIcon = document.getElementById('gameOverIcon');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');
        const gameOverPlayer1Name = document.getElementById('gameOverPlayer1Name');
        const gameOverPlayer2Name = document.getElementById('gameOverPlayer2Name');
        const gameOverPlayer1Score = document.getElementById('gameOverPlayer1Score');
        const gameOverPlayer2Score = document.getElementById('gameOverPlayer2Score');
        if (gameOverModal && gameOverIcon && gameOverTitle && gameOverMessage) {
            this.playEndGameSound();
            // Set winner icon and title
            gameOverIcon.textContent = '🏆';
            gameOverTitle.textContent = 'Game Over!';
            // Check if this is a tournament game
            if (this.currentTournamentMatch) {
                // Use tournament player names
                const winnerName = winner === 1 ? this.currentTournamentMatch.player1 : this.currentTournamentMatch.player2;
                const loserName = winner === 1 ? this.currentTournamentMatch.player2 : this.currentTournamentMatch.player1;
                gameOverMessage.textContent = `${winnerName} wins!`;
                // Set player names and scores
                if (gameOverPlayer1Name && gameOverPlayer2Name && gameOverPlayer1Score && gameOverPlayer2Score) {
                    gameOverPlayer1Name.textContent = this.currentTournamentMatch.player1;
                    gameOverPlayer2Name.textContent = this.currentTournamentMatch.player2;
                    gameOverPlayer1Score.textContent = this.gameState?.scorePlayer1?.toString() || '0';
                    gameOverPlayer2Score.textContent = this.gameState?.scorePlayer2?.toString() || '0';
                }
            }
            else {
                // Use regular 1v1 logic
                if (winner === 1) {
                    gameOverMessage.textContent = `${this.currentUser.username} wins!`;
                }
                else {
                    gameOverMessage.textContent = 'Local Player wins!';
                }
                // Set player names and scores
                if (gameOverPlayer1Name && gameOverPlayer2Name && gameOverPlayer1Score && gameOverPlayer2Score) {
                    gameOverPlayer1Name.textContent = this.currentUser.username || 'Player 1';
                    gameOverPlayer2Name.textContent = 'Local Player';
                    gameOverPlayer1Score.textContent = this.gameState?.scorePlayer1?.toString() || '0';
                    gameOverPlayer2Score.textContent = this.gameState?.scorePlayer2?.toString() || '0';
                }
            }
            // Show the modal
            gameOverModal.classList.remove('hidden');
<<<<<<< HEAD
            // Show power-ups toggle when game ends
            this.showPowerupsToggle('1v1');
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
            // Set up button event listeners
            const playAgainBtn = document.getElementById('playAgainBtn');
            const goHomeBtn = document.getElementById('goHomeBtn');
            if (playAgainBtn) {
                // Remove existing listeners by cloning the button
                const newPlayAgainBtn = playAgainBtn.cloneNode(true);
                playAgainBtn.parentNode?.replaceChild(newPlayAgainBtn, playAgainBtn);
                // Add unique identifier to prevent multiple handlers
                newPlayAgainBtn.setAttribute('data-handler-attached', 'true');
                newPlayAgainBtn.onclick = async () => {
                    console.log('Play Again clicked');
                    gameOverModal.classList.add('hidden');
                    this.startNewGame();
                };
            }
            if (goHomeBtn) {
                // Remove existing listeners by cloning the button
                const newGoHomeBtn = goHomeBtn.cloneNode(true);
                goHomeBtn.parentNode?.replaceChild(newGoHomeBtn, goHomeBtn);
                // Add unique identifier to prevent multiple handlers
                newGoHomeBtn.setAttribute('data-handler-attached', 'true');
                newGoHomeBtn.onclick = async () => {
                    console.log('Go to Home clicked');
                    gameOverModal.classList.add('hidden');
                    this.goHome();
                };
            }
        }
        console.log(`Game ended. Winner: Player ${winner}`);
    }
    startNewGame() {
        console.log('Starting new game...');
        // Reset game state
        this.resetGameState();
        // Update score display to reflect reset scores
        this.updateScoreDisplay();
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
    async loadUserProfile() {
        if (!this.currentUser) {
            console.log('No current user found, cannot load profile');
            return;
        }
        console.log('Loading user profile for user:', this.currentUser.id);
        console.log('Current cookies:', document.cookie);
        try {
            console.log('Loading user profile, current cookies:', document.cookie);
            const response = await fetch(`https://${HOST_IP}/api/profile/me`, {
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
            }
            else if (response.status === 401) {
                // Unauthorized - try to refresh token first
                console.log('User not authenticated, attempting token refresh...');
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                // Try to refresh the token instead of immediately logging out
                await this.tryRefreshToken();
            }
            else {
                console.error('Failed to load user profile:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                this.showStatus(`Failed to load profile data: ${response.status}`, 'error');
            }
        }
        catch (error) {
            console.error('Error loading user profile:', error);
            this.showStatus('Network error loading profile', 'error');
        }
    }
    updateHomeDashboard() {
        if (!this.currentUser) {
            console.log('No current user found for updateHomeDashboard');
            return;
        }
        console.log('Updating home dashboard with user stats:', {
            gamesPlayed: this.currentUser.gamesPlayed,
            wins: this.currentUser.wins,
            losses: this.currentUser.losses
        });
        // Update main stats
        const homeTotalGames = document.getElementById('homeTotalGames');
        const homeTotalWins = document.getElementById('homeTotalWins');
        const homeWinRate = document.getElementById('homeWinRate');
        if (homeTotalGames) {
            homeTotalGames.textContent = this.currentUser.gamesPlayed || '0';
            console.log('Updated homeTotalGames to:', this.currentUser.gamesPlayed || '0');
        }
        else {
            console.log('homeTotalGames element not found');
        }
        if (homeTotalWins) {
            homeTotalWins.textContent = this.currentUser.wins || '0';
            console.log('Updated homeTotalWins to:', this.currentUser.wins || '0');
        }
        else {
            console.log('homeTotalWins element not found');
        }
        // Calculate win rate
        const gamesPlayed = this.currentUser.gamesPlayed || 0;
        const wins = this.currentUser.wins || 0;
        const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
        if (homeWinRate) {
            homeWinRate.textContent = `${winRate}%`;
            console.log('Updated homeWinRate to:', `${winRate}%`);
        }
        else {
            console.log('homeWinRate element not found');
        }
        // Update profile stats (if they exist)
        const profileGames = document.getElementById('profileGames');
        const profileWins = document.getElementById('profileWins');
        const profileLosses = document.getElementById('profileLosses');
        if (profileGames) {
            profileGames.textContent = this.currentUser.gamesPlayed || '0';
            console.log('Updated profileGames to:', this.currentUser.gamesPlayed || '0');
        }
        if (profileWins) {
            profileWins.textContent = this.currentUser.wins || '0';
            console.log('Updated profileWins to:', this.currentUser.wins || '0');
        }
        if (profileLosses) {
            profileLosses.textContent = this.currentUser.losses || '0';
            console.log('Updated profileLosses to:', this.currentUser.losses || '0');
        }
    }
    async updateUserStats(userWon, gameType = 'LOCAL', player1Score, player2Score, gameDuration) {
        // Update stats for all games including tournament games
        if (!this.currentUser) {
            console.log('No current user found, cannot update stats');
            return;
        }
        console.log('Updating user stats, user won:', userWon, 'game type:', gameType, 'scores:', player1Score, player2Score);
        try {
            const response = await fetch(`https://${HOST_IP}/api/profile/update-stats`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    won: userWon,
                    gameType: gameType,
                    player1Score: player1Score,
                    player2Score: player2Score,
                    gameDuration: gameDuration
                })
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Stats updated successfully:', data);
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                this.updateProfileDisplay();
                this.updateHomeDashboard();
                // Also refresh dashboard data if dashboard is currently shown
                this.loadDashboardData();
            }
            else {
                console.error('Failed to update stats:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                console.error('Response headers:', response.headers);
                console.error('Request URL:', response.url);
                this.showStatus(`Failed to update game stats: ${response.status} ${response.statusText}`, 'error');
            }
        }
        catch (error) {
            console.error('Error updating user stats:', error);
            this.showStatus('Network error updating stats', 'error');
        }
    }
    async updateTournamentStats(userWon, player1Score, player2Score, opponentName) {
        // Update stats specifically for tournament games with complete game data
        if (!this.currentUser) {
            console.log('No current user found, cannot update tournament stats');
            return;
        }
        console.log('Updating tournament stats, user won:', userWon);
        try {
            const response = await fetch(`https://${HOST_IP}/api/profile/update-stats`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    won: userWon,
                    gameType: 'TOURNAMENT',
                    player1Score: player1Score,
                    player2Score: player2Score,
                    opponentName: opponentName
                })
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Tournament stats updated successfully:', data);
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                this.updateProfileDisplay();
                this.updateHomeDashboard();
                this.loadDashboardData();
            }
            else {
                console.error('Failed to update tournament stats:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                this.showStatus(`Failed to update tournament stats: ${response.status} ${response.statusText}`, 'error');
            }
        }
        catch (error) {
            console.error('Error updating tournament stats:', error);
            this.showStatus('Network error updating tournament stats', 'error');
        }
    }
    updateProfileDisplay() {
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
        const profileAvatar = document.getElementById('profileAvatar');
        console.log('Found elements:', {
            profileUsername: !!profileUsername,
            profileEmail: !!profileEmail,
            profileGames: !!profileGames,
            profileWins: !!profileWins,
            profileLosses: !!profileLosses,
            profileAvatar: !!profileAvatar
        });
        // Update avatar
        if (profileAvatar) {
            console.log('🔍 Avatar debug info:', {
                hasAvatarUrl: !!this.currentUser.avatarUrl,
                avatarUrl: this.currentUser.avatarUrl,
                currentUser: this.currentUser
            });
            if (this.currentUser.avatarUrl && this.currentUser.avatarUrl !== '/avatars/default.jpg') {
                // Use the user's custom avatar (not the default one from database)
                const avatarSrc = `https://${HOST_IP}${this.currentUser.avatarUrl}?t=${Date.now()}`;
                profileAvatar.src = avatarSrc;
                console.log('✅ Updated avatar with custom image:', avatarSrc);
            }
            else {
                // Use default avatar image (either no avatarUrl or it's the default one)
                profileAvatar.src = `./imgs/default.jpg`;
                console.log('✅ Updated avatar with default image for:', this.currentUser.username);
            }
        }
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
        // Update 2FA toggle
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        if (twoFactorToggle && this.currentUser) {
            twoFactorToggle.checked = this.currentUser.isTwoFactorEnabled || false;
            // Show/hide enable button based on current state
            const enable2faBtn = document.getElementById('enable2faBtn');
            if (enable2faBtn) {
                if (!this.currentUser.isTwoFactorEnabled && twoFactorToggle.checked) {
                    enable2faBtn.style.display = 'block';
                }
                else {
                    enable2faBtn.style.display = 'none';
                }
            }
        }
        // Force a visual update
        setTimeout(() => {
            console.log('Current display values:');
            if (profileGames)
                console.log('Games displayed:', profileGames.textContent);
            if (profileWins)
                console.log('Wins displayed:', profileWins.textContent);
            if (profileLosses)
                console.log('Losses displayed:', profileLosses.textContent);
        }, 100);
        // Also update home dashboard
        this.updateHomeDashboard();
    }
    async refreshUserData() {
        try {
            console.log('🔄 Refreshing user data from server...');
            const response = await fetch(`https://${HOST_IP}/api/auth/profile`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const userData = await response.json();
                console.log('📊 Fresh user data received:', userData);
                // Update current user with fresh data
                this.currentUser = userData;
                // Update localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                // Update display
                this.updateProfileDisplay();
                this.updateHomeDashboard();
                this.loadDashboardData();
                console.log('✅ User data refreshed successfully');
            }
            else {
                console.log('❌ Failed to refresh user data:', response.status);
            }
        }
        catch (error) {
            console.log('❌ Error refreshing user data:', error);
        }
    }
    checkTokenExpiration() {
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
        }
        catch (error) {
            console.error('Error checking token expiration:', error);
            localStorage.removeItem('user');
            this.currentUser = null;
            this.showPage('registrationPage');
        }
    }
    async refreshToken() {
        try {
            const response = await fetch(`https://${HOST_IP}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            else {
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showPage('registrationPage');
            }
        }
        catch (error) {
            console.error('Error refreshing token:', error);
            localStorage.removeItem('user');
            this.currentUser = null;
            this.showPage('registrationPage');
        }
    }
    clearCacheAndReload() {
        // Removed - no longer needed
    }
    async recordTournamentResult(winner, loser) {
        console.log('=== RECORDING TOURNAMENT RESULT ===');
        console.log('Winner:', winner, 'Loser:', loser);
        console.log('Tournament ID:', this.tournamentState.tournamentId);
        if (!this.currentUser) {
            console.log('No authentication token, skipping backend recording');
            return;
        }
        try {
            const url = `https://${HOST_IP}/api/tournament/local-result`;
            const requestBody = {
                winner,
                loser,
                tournamentName: 'Local Tournament',
                tournamentId: this.tournamentState.tournamentId,
                round: this.tournamentState.currentRound + 1 // Add round info
            };
            console.log('Recording result with data:', requestBody);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                credentials: 'include'
            });
            const result = await response.json();
            console.log('Record result response:', result);
            if (!response.ok) {
                console.error('Failed to record tournament result:', result.error);
                return;
            }
            console.log('Tournament result recorded successfully:', result.message);
        }
        catch (error) {
            console.error('Error recording tournament result:', error);
        }
    }
    setupTournament(playerCount) {
        // Clear previous tournament state
        this.tournamentState = {
            players: [],
            currentRound: 0,
            currentMatch: 0,
            matches: [],
            bracket: []
        };
        // Hide player count selection
        const tournament4Players = document.getElementById('tournament4Players');
        if (tournament4Players)
            tournament4Players.style.display = 'none';
        // Show player names form
        const playerNamesForm = document.getElementById('playerNamesForm');
        if (playerNamesForm) {
            playerNamesForm.classList.remove('hidden');
        }
        // Generate player input fields
        const playerInputs = document.getElementById('playerInputs');
        if (playerInputs) {
            playerInputs.innerHTML = '';
            // First player is always the current user
            const firstPlayerDiv = document.createElement('div');
            firstPlayerDiv.className = 'flex flex-col';
            firstPlayerDiv.innerHTML = `
                <label class="text-white text-lg font-bold mb-2">Player 1 (You):</label>
                <input type="text" id="player0" value="${this.currentUser?.username || 'Player 1'}" readonly
                       class="px-3 py-2 rounded border-2 border-powerpuff-green bg-white bg-opacity-30 text-white text-lg font-bold cursor-not-allowed">
            `;
            playerInputs.appendChild(firstPlayerDiv);
            // Generate remaining player input fields
            for (let i = 1; i < 4; i++) {
                const inputDiv = document.createElement('div');
                inputDiv.className = 'flex flex-col';
                inputDiv.innerHTML = `
                    <label class="text-white text-lg font-bold mb-2">Player ${i + 1}:</label>
                    <input type="text" id="player${i}" placeholder="Enter player name" required
                           class="px-3 py-2 rounded border-2 border-powerpuff-purple bg-white bg-opacity-30 text-white text-lg font-bold placeholder-white placeholder-opacity-70 focus:outline-none focus:border-powerpuff-pink">
                `;
                playerInputs.appendChild(inputDiv);
            }
        }
        this.showStatus(`Tournament setup for 4 players`, 'info');
    }
    async startTournament() {
        // Collect player names
        const players = [];
        for (let i = 0; i < 4; i++) {
            const input = document.getElementById(`player${i}`);
            if (input && input.value.trim()) {
                players.push(input.value.trim());
            }
            else {
                this.showStatus(`Please enter name for Player ${i + 1}`, 'error');
                return;
            }
        }
        const uniqueNames = new Set(players);
        if (uniqueNames.size !== players.length) {
            this.showStatus('Player names must be unique', 'error');
            return;
        }
        await this.createTournamentInDatabase(players);
        if (players.length !== 4) {
            this.showStatus(`Please enter all 4 player names`, 'error');
            return;
        }
        // Initialize tournament state
        this.tournamentState.players = players;
        this.tournamentState.currentRound = 0;
        this.tournamentState.currentMatch = 0;
        this.tournamentState.matches = [];
        this.tournamentState.bracket = [];
        // Generate bracket
        this.generateBracket();
        // Hide setup, show bracket
        const playerNamesForm = document.getElementById('playerNamesForm');
        const tournamentBracket = document.getElementById('tournamentBracket');
        if (playerNamesForm)
            playerNamesForm.classList.add('hidden');
        if (tournamentBracket)
            tournamentBracket.classList.remove('hidden');
        this.showStatus('Tournament started!', 'success');
        this.showNextMatch();
    }
    async createTournamentInDatabase(players) {
        if (!this.currentUser) {
            console.log('No authentication token, skipping tournament creation in database');
            return;
        }
        try {
            // Use correct URL - adjust port/protocol as needed
            const url = `https://${HOST_IP}/api/tournament/create`;
            console.log('Making request to:', url);
            const requestBody = {
                name: `Local Tournament - ${new Date().toLocaleDateString()}`,
                players: players,
                maxPlayers: 4
            };
            console.log('Request body:', requestBody);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                credentials: 'include'
            });
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            const result = await response.json();
            console.log('Response body:', result);
            if (response.ok) {
                this.tournamentState.tournamentId = result.tournamentId;
                console.log('Tournament created in database with ID:', result.tournamentId);
            }
            else {
                console.error('Failed to create tournament in database:', result.error);
            }
        }
        catch (error) {
            console.error('Error creating tournament in database:', error);
        }
    }
    async completeTournamentInDatabase(winnerId) {
        if (!this.currentUser || !this.tournamentState.tournamentId) {
            console.log('No authentication token or tournament ID, skipping tournament completion');
            return;
        }
        try {
            const response = await fetch(`https://${HOST_IP}/api/tournament/${this.tournamentState.tournamentId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    winnerId: winnerId || null
                }),
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok) {
                console.log('Tournament completed in database:', result.message);
            }
            else {
                console.error('Failed to complete tournament in database:', result.error);
            }
        }
        catch (error) {
            console.error('Error completing tournament in database:', error);
        }
    }
    generateBracket() {
        const players = [...this.tournamentState.players];
        const bracket = [];
        // Shuffle players for random seeding
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
        // Generate first round matches
        const firstRound = [];
        for (let i = 0; i < players.length; i += 2) {
            if (i + 1 < players.length) {
                firstRound.push({
                    player1: players[i],
                    player2: players[i + 1],
                    winner: undefined
                });
            }
        }
        bracket.push(firstRound);
        this.tournamentState.bracket = bracket;
        this.tournamentState.matches = [...firstRound];
        this.tournamentState.currentRound = 0;
        this.tournamentState.currentMatch = 0;
        console.log(`Generated tournament bracket for ${players.length} players:`);
        console.log(`First round: ${firstRound.length} matches`);
        console.log(`Expected rounds: ${Math.ceil(Math.log2(players.length))}`);
        this.displayBracket();
    }
    displayBracket() {
        const bracketContainer = document.getElementById('bracketContainer');
        if (!bracketContainer)
            return;
        bracketContainer.innerHTML = '';
        this.tournamentState.bracket.forEach((round, roundIndex) => {
            const roundDiv = document.createElement('div');
            // Make boxes bigger for 2-round tournaments
            const totalPlayers = this.tournamentState.players.length;
            const expectedRounds = Math.ceil(Math.log2(totalPlayers));
            const isLastRound = roundIndex === this.tournamentState.bracket.length - 1;
            const isFinalMatch = round.length === 1;
            if (expectedRounds <= 2) {
                // 4-player tournament - bigger boxes
                roundDiv.className = 'mr-12';
            }
            let roundTitle = isFinalMatch ? 'Final' : 'Semifinal';
            roundDiv.innerHTML = `
                <h4 class="text-2xl font-bold text-white mb-4 text-center">${roundTitle}</h4>
            `;
            round.forEach((match, matchIndex) => {
                const matchDiv = document.createElement('div');
                // Bigger boxes for 2-round tournaments
                const boxClass = 'bg-white/20 rounded-lg border border-white/30 mb-3';
                matchDiv.className = boxClass;
                matchDiv.innerHTML = `
                    <div class="text-white text-base text-center">
                        <div class="${match.winner === match.player1 ? 'font-bold text-powerpuff-green text-lg' : 'text-lg'}">${match.player1}</div>
                        <div class="text-sm text-gray-300 mb-1">vs</div>
                        <div class="${match.winner === match.player2 ? 'font-bold text-powerpuff-green text-lg' : 'text-lg'}">${match.player2}</div>
                        ${match.winner ? `<div class="text-sm text-powerpuff-green mt-2 font-bold">Winner: ${match.winner}</div>` : ''}
                    </div>
                `;
                roundDiv.appendChild(matchDiv);
            });
            bracketContainer.appendChild(roundDiv);
        });
    }
    showNextMatch() {
        const currentMatch = this.tournamentState.matches[this.tournamentState.currentMatch];
        if (!currentMatch) {
            this.showTournamentResults();
            return;
        }
        const currentMatchDiv = document.getElementById('currentMatch');
        const matchInfo = document.getElementById('matchInfo');
        if (currentMatchDiv)
            currentMatchDiv.classList.remove('hidden');
        if (matchInfo) {
            matchInfo.innerHTML = `
                <div class="text-3xl font-bold text-powerpuff-pink mb-3">${currentMatch.player1}</div>
                <div class="text-2xl text-white mb-3">vs</div>
                <div class="text-3xl font-bold text-powerpuff-blue mb-3">${currentMatch.player2}</div>
                <div class="text-lg text-gray-300">Match ${this.tournamentState.currentMatch + 1} of ${this.tournamentState.matches.length}</div>
            `;
        }
        // Reset game state for next match
        this.resetGameState();
        // Show start button again for next match
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.style.display = 'block';
        }
    }
    startCurrentMatch() {
        const currentMatch = this.tournamentState.matches[this.tournamentState.currentMatch];
        if (!currentMatch) {
            console.error('No current match found');
            return;
        }
        console.log('Starting tournament match:', currentMatch);
        console.log('Current match index:', this.tournamentState.currentMatch);
        console.log('Total matches:', this.tournamentState.matches.length);
        // Hide current match section
        const currentMatchDiv = document.getElementById('currentMatch');
        if (currentMatchDiv)
            currentMatchDiv.classList.add('hidden');
        // Show the game section and initialize the actual game
        this.showSection('gameSection');
<<<<<<< HEAD
        // Hide power-ups toggle when tournament match starts
        this.hidePowerupsToggle('tournament');
        // Set powerupsEnabled based on tournament toggle state
        const toggleTournament = document.getElementById('powerupsToggleTournament');
        const enabled = toggleTournament ? toggleTournament.checked : true; // Default to true if toggle not found
        console.log('Set powerupsEnabled based on tournament toggle:', enabled);
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        // Set up the game with tournament players
        setTimeout(() => {
            this.initializeTournamentGame(currentMatch);
        }, 100);
    }
    initializeTournamentGame(match) {
        // Set up the game canvas and controls
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const startButton = document.getElementById('startButton');
        const gameOverlay = document.getElementById('gameOverlay');
        const gameMessage = document.getElementById('gameMessage');
        const player1Name = document.getElementById('player1Name');
        const player2Name = document.getElementById('player2Name');
        if (!canvas || !ctx || !startButton || !gameOverlay || !gameMessage || !player1Name || !player2Name) {
            console.error('Tournament game elements not found');
            return;
        }
        // Reset game state completely
        this.resetGameState();
        // Draw the initial game state with reset positions
        this.drawGame();
        // Set tournament player names
        player1Name.textContent = match.player1;
        player2Name.textContent = match.player2;
        // Reset scores to game state values
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        if (player1Score)
            player1Score.textContent = this.gameState?.scorePlayer1?.toString() || '0';
        if (player2Score)
            player2Score.textContent = this.gameState?.scorePlayer2?.toString() || '0';
        // Update score display to ensure it's correct
        this.updateScoreDisplay();
        // Show game overlay with tournament message
        gameOverlay.style.display = 'flex';
        gameMessage.textContent = `Tournament Match: ${match.player1} vs ${match.player2}`;
        gameMessage.className = 'text-2xl font-bold text-white mb-4 text-center';
        // Store current match for result handling
        this.currentTournamentMatch = match;
        // Add tournament-specific game end handler
        this.setupTournamentGameEndHandler();
        // Initialize game controls and event listeners
        this.initializeGameControls();
    }
    initializeGameControls() {
        // Set up start button event listener
        const startButton = document.getElementById('startButton');
        if (startButton) {
            // Remove existing listeners
            const newStartButton = startButton.cloneNode(true);
            startButton.parentNode?.replaceChild(newStartButton, startButton);
            newStartButton.addEventListener('click', () => {
                this.startLocalGame();
            });
        }
        // Set up customize button event listener
        const customizeBtn = document.getElementById('customizeBtn');
        if (customizeBtn) {
            // Remove existing listeners
            const newCustomizeBtn = customizeBtn.cloneNode(true);
            customizeBtn.parentNode?.replaceChild(newCustomizeBtn, customizeBtn);
            newCustomizeBtn.addEventListener('click', () => {
                this.showCustomizationModal();
            });
        }
        // Set up keyboard controls
        this.setupGameControls();
    }
    setupTournamentGameEndHandler() {
        // Store original endGame method
        this.originalEndGame = this.endGame;
        // Override the normal game end to handle tournament progression
        this.endGame = async (winner) => {
            // Only handle tournament game end if we're in a tournament match
            if (this.currentTournamentMatch) {
                this.handleTournamentGameEnd(winner);
            }
            else {
                // If not in tournament, call the original endGame method
                if (this.originalEndGame) {
                    this.originalEndGame.call(this, winner);
                }
            }
        };
    }
    async handleTournamentGameEnd(winner) {
        const currentMatch = this.currentTournamentMatch;
        if (!currentMatch)
            return;
        // Stop the game loop immediately
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
            console.log('Tournament game loop stopped');
        }
        // Convert winner number to player name
        const winnerName = winner === 1 ? currentMatch.player1 : currentMatch.player2;
        const loserName = winner === 1 ? currentMatch.player2 : currentMatch.player1;
        currentMatch.winner = winnerName;
        await this.recordTournamentResult(winnerName, loserName);
        // Update stats for the current user if they participated
        if (this.currentUser && (currentMatch.player1 === this.currentUser.username || currentMatch.player2 === this.currentUser.username)) {
            const userWon = winnerName === this.currentUser.username;
            console.log('Updating tournament stats for user:', this.currentUser.username, 'Won:', userWon);
            await this.updateTournamentStats(userWon, this.gameState.scorePlayer1, this.gameState.scorePlayer2, currentMatch.player1 === this.currentUser.username ? currentMatch.player2 : currentMatch.player1);
        }
        else {
            console.log('Current user not participating in this tournament match, skipping stats update');
        }
        // Update bracket display
        this.displayBracket();
<<<<<<< HEAD
        // Show power-ups toggle when tournament match ends
        this.showPowerupsToggle('tournament');
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        // Restore original endGame method
        if (this.originalEndGame) {
            this.endGame = this.originalEndGame;
            this.originalEndGame = null;
        }
        // Clear tournament match reference
        this.currentTournamentMatch = null;
        // Go directly to tournament section
        this.showSection('localTournamentSection');
        // Hide game section
        const gameSection = document.getElementById('gameSection');
        if (gameSection)
            gameSection.classList.remove('active');
        // Check if this was the last match in the current round
        if (this.tournamentState.currentMatch >= this.tournamentState.matches.length - 1) {
            // Round is complete, automatically advance to next round
            setTimeout(() => {
                this.nextMatch();
            }, 1500); // Show result briefly, then advance
        }
        else {
            // Show match results section for current round
            const matchResults = document.getElementById('matchResults');
            if (matchResults)
                matchResults.classList.remove('hidden');
            // Show results with bigger font
            const resultsInfo = document.getElementById('resultsInfo');
            if (resultsInfo) {
                resultsInfo.innerHTML = `
                    <div class="text-4xl font-bold text-powerpuff-green mb-4">🏆 Winner: ${winnerName}</div>
                    <div class="text-2xl text-white mb-4">${currentMatch.player1} vs ${currentMatch.player2}</div>
                    <div class="text-lg text-gray-300">Match ${this.tournamentState.currentMatch + 1} completed</div>
                `;
            }
        }
        // Don't show status popup for tournament games to avoid spam
        // this.showStatus(`${winnerName} wins the match!`, 'success');
    }
    handleTournamentPlayerLeave(playerName) {
        const currentMatch = this.currentTournamentMatch;
        if (!currentMatch)
            return;
        console.log(`Player ${playerName} left the tournament match`);
        // Stop the game loop immediately
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
            console.log('Tournament game loop stopped due to player leaving');
        }
        // Determine the winner (the player who didn't leave)
        const winnerName = currentMatch.player1 === playerName ? currentMatch.player2 : currentMatch.player1;
        currentMatch.winner = winnerName;
        console.log(`Winner by default: ${winnerName} (${playerName} left)`);
        // Update stats for both players
        if (this.currentUser) {
            if (currentMatch.player1 === this.currentUser.username || currentMatch.player2 === this.currentUser.username) {
                const userWon = winnerName === this.currentUser.username;
                console.log('Updating tournament stats for user who stayed:', this.currentUser.username, 'Won:', userWon);
                this.updateUserStats(userWon);
            }
        }
        // Update bracket display
        this.displayBracket();
        // Go directly to tournament section
        this.showSection('localTournamentSection');
        // Hide game section
        const gameSection = document.getElementById('gameSection');
        if (gameSection)
            gameSection.classList.remove('active');
        // Show match results section for current round
        const matchResults = document.getElementById('matchResults');
        if (matchResults)
            matchResults.classList.remove('hidden');
        // Show results with bigger font
        const resultsInfo = document.getElementById('resultsInfo');
        if (resultsInfo) {
            resultsInfo.innerHTML = `
                <div class="text-4xl font-bold text-powerpuff-green mb-4">🏆 Winner: ${winnerName}</div>
                <div class="text-2xl text-white mb-4">${currentMatch.player1} vs ${currentMatch.player2}</div>
                <div class="text-lg text-gray-300">Match ${this.tournamentState.currentMatch + 1} completed</div>
                <div class="text-sm text-red-400 mt-2">${playerName} left the match</div>
            `;
        }
        // Check if this was the last match in the current round
        if (this.tournamentState.currentMatch >= this.tournamentState.matches.length - 1) {
            // Round is complete, automatically advance to next round
            setTimeout(() => {
                this.nextMatch();
            }, 2000); // Show result briefly, then advance
        }
    }
    showTournamentMatchResults(match, winner) {
        // Go back to tournament section
        this.showSection('localTournamentSection');
        // Hide game section
        const gameSection = document.getElementById('gameSection');
        if (gameSection)
            gameSection.classList.remove('active');
        // Show match results section
        const matchResults = document.getElementById('matchResults');
        if (matchResults)
            matchResults.classList.remove('hidden');
        // Show results
        const resultsInfo = document.getElementById('resultsInfo');
        if (resultsInfo) {
            resultsInfo.innerHTML = `
                <div class="text-2xl font-bold text-powerpuff-green mb-2">🏆 Winner: ${winner}</div>
                <div class="text-lg text-white mb-2">${match.player1} vs ${match.player2}</div>
                <div class="text-sm text-gray-300">Match ${this.tournamentState.currentMatch + 1} completed</div>
            `;
        }
        this.showStatus(`${winner} wins the match!`, 'success');
    }
    nextMatch() {
        this.tournamentState.currentMatch++;
        // Hide results section
        const matchResults = document.getElementById('matchResults');
        if (matchResults)
            matchResults.classList.add('hidden');
        // Check if current round is complete
        if (this.tournamentState.currentMatch >= this.tournamentState.matches.length) {
            // Round is complete, generate next round
            this.generateNextRound();
        }
        else {
            // Show next match in current round
            this.showNextMatch();
        }
    }
    generateNextRound() {
        const currentRound = this.tournamentState.bracket[this.tournamentState.currentRound];
        const winners = currentRound.map(match => match.winner).filter(Boolean);
        console.log(`Generating next round from ${winners.length} winners:`, winners);
        // Only end tournament if we have exactly 1 winner
        if (winners.length === 1) {
            console.log('Tournament complete - single winner found');
            // Tournament complete
            this.showTournamentResults();
            return;
        }
        // Generate next round matches
        const nextRound = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                nextRound.push({
                    player1: winners[i],
                    player2: winners[i + 1],
                    winner: undefined
                });
            }
        }
        console.log(`Generated ${nextRound.length} matches for next round:`, nextRound);
        this.tournamentState.bracket.push(nextRound);
        this.tournamentState.matches = [...nextRound];
        this.tournamentState.currentRound++;
        this.tournamentState.currentMatch = 0;
        console.log(`Tournament state updated - Round: ${this.tournamentState.currentRound}, Match: ${this.tournamentState.currentMatch}`);
        this.displayBracket();
        this.showNextMatch();
    }
    showTournamentResults() {
        const currentRound = this.tournamentState.bracket[this.tournamentState.currentRound];
        const winner = currentRound[0]?.winner;
        if (!winner)
            return;
        this.completeTournamentInDatabase();
        // Hide all other sections
        const sections = ['playerNamesForm', 'tournamentBracket', 'currentMatch', 'matchResults'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element)
                element.classList.add('hidden');
        });
        // Show results
        const tournamentResults = document.getElementById('tournamentResults');
        const championInfo = document.getElementById('championInfo');
        if (tournamentResults)
            tournamentResults.classList.remove('hidden');
        if (championInfo) {
            // Persist section so refresh stays on tournament page
            localStorage.setItem('lastActiveSection', 'localTournamentSection');
            // Play end-of-game sound for tournament completion
            this.playEndGameSound();
            // Create comprehensive tournament summary
            const playerCount = this.tournamentState.players.length;
            const allPlayers = this.tournamentState.players.join(', ');
            championInfo.innerHTML = `
                <div class="text-4xl mb-4">🏆</div>
                <div class="text-3xl font-bold text-powerpuff-green mb-4">${winner}</div>
                <div class="text-lg text-white mb-6">Tournament Champion!</div>
                
                <div class="bg-white/20 rounded-lg p-4 mb-6">
                    <div class="text-lg font-bold text-white mb-2">Tournament Summary</div>
                    <div class="text-sm text-gray-300 mb-2">Players: ${allPlayers}</div>
                    <div class="text-sm text-powerpuff-green font-bold">Winner: ${winner}</div>
                </div>
            `;
        }
        // Update the button to "See Results" instead of "New Tournament"
        const newTournamentBtn = document.getElementById('newTournament');
        if (newTournamentBtn) {
            newTournamentBtn.textContent = '🏆 New Tournament';
            newTournamentBtn.className = 'bg-powerpuff-green hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg';
        }
        // Add "Go Home" button
        const buttonContainer = document.querySelector('#tournamentResults .text-center');
        if (buttonContainer) {
            // Remove any existing Go Home button
            const existingGoHomeBtn = buttonContainer.querySelector('button[data-action="go-home"]');
            if (existingGoHomeBtn) {
                existingGoHomeBtn.remove();
            }
            const goHomeBtn = document.createElement('button');
            goHomeBtn.className = 'bg-powerpuff-pink hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg ml-4';
            goHomeBtn.textContent = '🏠 Go Home';
            goHomeBtn.setAttribute('data-action', 'go-home');
            goHomeBtn.addEventListener('click', () => {
                console.log('Tournament results Go Home clicked');
                this.goHome();
            });
            buttonContainer.appendChild(goHomeBtn);
        }
        this.showStatus(`🏆 ${winner} is the Tournament Champion!`, 'success');
    }
    resetTournament() {
        // Reset tournament state
        this.tournamentState = {
            players: [],
            currentRound: 0,
            currentMatch: 0,
            matches: [],
            bracket: []
        };
        // Show player count selection again
        const tournament4Players = document.getElementById('tournament4Players');
        if (tournament4Players)
            tournament4Players.style.display = 'block';
        // Hide all sections
        const sections = ['playerNamesForm', 'tournamentBracket', 'currentMatch', 'matchResults', 'tournamentResults'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element)
                element.classList.add('hidden');
        });
        this.showStatus('Tournament reset. Select number of players to start a new tournament.', 'info');
    }
    initializeRemoteGame() {
        if (this.onlineGameState.gameSocket) {
            this.onlineGameState.gameSocket.onopen = null;
            this.onlineGameState.gameSocket.onmessage = null;
            this.onlineGameState.gameSocket.onerror = null;
            this.onlineGameState.gameSocket.onclose = null;
            this.onlineGameState.gameSocket.close();
            this.onlineGameState.gameSocket = null;
        }
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal)
            gameOverModal.classList.add('hidden');
        this.hideRemoteGameMessage();
        // Set up the online game canvas and controls for remote game
        const canvas = document.getElementById('onlineGameCanvas');
        const ctx = canvas.getContext('2d');
        const gameOverlay = document.getElementById('onlineGameOverlay');
        const gameMessage = document.getElementById('onlineGameMessage');
        const player1Name = document.getElementById('onlinePlayer1Name');
        const player2Name = document.getElementById('onlinePlayer2Name');
        const customizeButton = document.getElementById('onlineCustomizeBtn');
        console.log('Remote game elements found:', {
            canvas: !!canvas,
            ctx: !!ctx,
            gameOverlay: !!gameOverlay,
            gameMessage: !!gameMessage,
            player1Name: !!player1Name,
            player2Name: !!player2Name,
            customizeButton: !!customizeButton
        });
        if (!canvas || !ctx || !gameOverlay || !gameMessage || !player1Name || !player2Name || !customizeButton) {
            console.error('Remote game elements not found');
            return;
        }
        // Reset game state
        this.resetGameState();
        // Set player names
        player1Name.textContent = this.currentUser.username || 'Player 1';
        player2Name.textContent = 'Waiting for opponent...';
        // Reset scores
        const player1Score = document.getElementById('onlinePlayer1Score');
        const player2Score = document.getElementById('onlinePlayer2Score');
        if (player1Score)
            player1Score.textContent = '0';
        if (player2Score)
            player2Score.textContent = '0';
        // Hide matchmaking status
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        if (matchmakingStatus) {
            matchmakingStatus.style.display = 'none';
        }
        // Hide matchmaking controls
        const matchmakingControls = document.querySelector('#onlineGameSection .flex.justify-center.space-x-4');
        if (matchmakingControls) {
            matchmakingControls.style.display = 'none';
        }
        // Show the score display
        console.log('🎮 Showing score display immediately');
        this.showScoreDisplay();
        // Initialize remote game state
        this.initializeRemoteGameState();
        // Set up remote game controls
        this.setupRemoteGameControls();
        // Initialize remote game canvas
        this.initializeRemoteGameCanvas();
        // Only auto-connect if not already connected
        if (!this.onlineGameState.isConnected && !this.onlineGameState.gameSocket) {
            this.connectToRemoteGame();
        }
        // Set up input handling
        this.setupRemoteGameInput();
        console.log('Remote game initialized successfully');
    }
    initializeRemoteGameState() {
        this.onlineGameState = {
            matchmakingSocket: null,
            gameSocket: null,
            matchId: '1', // Default match ID for remote game
            playerNumber: null,
            isConnected: false,
            isInMatch: false,
            gameFinished: false,
            gameState: {
                ballX: 400,
                ballY: 300,
                leftPaddleY: 250,
                rightPaddleY: 250,
                player1Score: 0,
                player2Score: 0,
                speedX: 5,
                speedY: 3
            }
        };
    }
    setupRemoteGameControls() {
        const customizeButton = document.getElementById('onlineCustomizeBtn');
        if (customizeButton) {
            customizeButton.addEventListener('click', () => {
                console.log('Remote game customize button clicked');
                this.showCustomizationModal();
            });
        }
    }
    initializeRemoteGameCanvas() {
        const canvas = document.getElementById('onlineGameCanvas');
        const ctx = canvas.getContext('2d');
        if (!canvas || !ctx) {
            console.error('Remote game canvas not found');
            return;
        }
        // Set up canvas
        canvas.width = 800;
        canvas.height = 600;
        // Initial draw
        this.drawRemoteGame();
        // Set up game loop
        const gameLoop = () => {
            this.drawRemoteGame();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    drawRemoteGame() {
        const canvas = document.getElementById('onlineGameCanvas');
        const ctx = canvas.getContext('2d');
        if (!canvas || !ctx)
            return;
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
        // Draw paddles with hover effect based on player side
        const myPaddleColor = this.customizationSettings.myPaddleColor;
        const opponentPaddleColor = this.customizationSettings.opponentPaddleColor;
        // Left paddle (15x100 to match local game)
        ctx.fillStyle = (this.onlineGameState.playerNumber === 1) ? myPaddleColor : opponentPaddleColor;
        ctx.fillRect(50, this.onlineGameState.gameState.leftPaddleY, 15, 100);
        // Right paddle (15x100 to match local game)
        ctx.fillStyle = (this.onlineGameState.playerNumber === 2) ? myPaddleColor : opponentPaddleColor;
        ctx.fillRect(735, this.onlineGameState.gameState.rightPaddleY, 15, 100);
        // Draw ball
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(this.onlineGameState.gameState.ballX, this.onlineGameState.gameState.ballY, 10, 0, Math.PI * 2);
        ctx.fill();
        // Highlight current player's paddle with glow effect
        if (this.onlineGameState.playerNumber === 1) {
            ctx.strokeStyle = this.customizationSettings.myPaddleColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(48, this.onlineGameState.gameState.leftPaddleY - 2, 19, 104);
            // Add glow effect
            ctx.shadowColor = this.customizationSettings.myPaddleColor;
            ctx.shadowBlur = 10;
            ctx.strokeRect(48, this.onlineGameState.gameState.leftPaddleY - 2, 19, 104);
            ctx.shadowBlur = 0;
        }
        else if (this.onlineGameState.playerNumber === 2) {
            ctx.strokeStyle = this.customizationSettings.myPaddleColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(733, this.onlineGameState.gameState.rightPaddleY - 2, 19, 104);
            // Add glow effect
            ctx.shadowColor = this.customizationSettings.myPaddleColor;
            ctx.shadowBlur = 10;
            ctx.strokeRect(733, this.onlineGameState.gameState.rightPaddleY - 2, 19, 104);
            ctx.shadowBlur = 0;
        }
        const scoreDisplay = document.getElementById('onlineScoreDisplay');
        if (scoreDisplay && scoreDisplay.style.display === 'none') {
            console.warn('Score display was hidden during game, reshowing...');
            this.showScoreDisplay();
        }
    }
    connectToRemoteGame() {
        const username = this.currentUser?.username || 'Anonymous';
        // Use nginx proxy for WebSocket connections
        // const protocol = 'ws:';
        const protocol = 'wss:';
        const host = window.location.host;
        // Use the integrated Fastify WebSocket endpoint instead of separate port
        const wsUrl = `${protocol}//${host}/api/find-match?username=${encodeURIComponent(username)}`;
        console.log('🔗 Connecting to WebSocket:', wsUrl);
        // Update status to show we're connecting
        this.updateRemoteGameStatus('Connecting', 'Establishing connection...', true);
        try {
            this.onlineGameState.gameSocket = new WebSocket(wsUrl);
            this.onlineGameState.gameSocket.onopen = (event) => {
                console.log('✅ Connected to remote game server!');
                this.onlineGameState.isConnected = true;
                this.updateRemoteGameStatus('Connected', 'WebSocket connection established');
            };
            this.onlineGameState.gameSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.matchId && data.matchId !== this.onlineGameState.matchId) {
                    // Ignore messages from old games
                    return;
                }
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 Received remote game message:', data);
                    console.log('📨 Message type:', data.type);
                    switch (data.type) {
                        case 'match-assigned':
                            console.log('✅ Match assigned:', data.matchId, 'Created:', data.created);
                            this.onlineGameState.matchId = data.matchId;
                            // Don't update status here - wait for success message
                            console.log('🎮 Match assigned, waiting for connection confirmation...');
                        case 'success':
                            this.onlineGameState.playerNumber = data.playerNumber;
                            this.updateRemoteGameStatus(`Connected as Player ${data.playerNumber}`, 'Searching for opponent...', true);
                            this.updatePlayerNames(data.player1Username, data.player2Username);
                            console.log(`🎮 Assigned as Player ${data.playerNumber}`);
                            break;
                        case 'waiting':
                            console.log('⏳ Waiting for opponent...');
                            this.updateRemoteGameStatus('Searching', 'Looking for an opponent to join...', true);
                            this.showWaitingForOpponent();
                            break;
                        case 'ready':
                            console.log('🎯 Game ready! Both players connected.');
                            this.hideWaitingForOpponent();
                            this.updateRemoteGameStatus('Match Found!', `Playing against ${data.player2Username || data.player1Username || 'opponent'}`, true);
                            this.showRemoteGameMessage('Both players ready! Game starting...');
                            // Show score display when opponent is found
                            this.showScoreDisplay();
                            // Update player names with the final usernames
                            if (data.player1Username && data.player2Username) {
                                this.updatePlayerNames(data.player1Username, data.player2Username);
                            }
                            // Initialize score display with 0-0
                            this.onlineGameState.gameState.player1Score = 0;
                            this.onlineGameState.gameState.player2Score = 0;
                            this.updateRemoteScore();
                            console.log('🎮 Game ready - score display should be visible');
                            break;
                        case 'ready-to-play':
                            console.log('🎮 Ready to play message received');
                            this.showRemoteGameMessage('Ready to play?');
                            break;
                        case 'countdown':
                            console.log(`⏰ Countdown: ${data.count}`);
                            this.showCountdown(data.count);
                            break;
                        case 'game-start':
                            console.log('🚀 Game started!');
                            this.hideCountdown();
                            this.updateRemoteGameStatus('Playing', 'Game in progress', true);
<<<<<<< HEAD
                            // Hide power-ups toggle when remote game starts
                            this.hidePowerupsToggle('online');
                            // Set powerupsEnabled based on online toggle state
                            const toggleOnline = document.getElementById('powerupsToggleOnline');
                            const enabled = toggleOnline ? toggleOnline.checked : true; // Default to true if toggle not found
                            console.log('Set powerupsEnabled based on online toggle:', enabled);
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
                            this.startRemoteGame();
                            // Make sure score display is visible and updated
                            this.showScoreDisplay();
                            this.onlineGameState.gameState.player1Score = 0;
                            this.onlineGameState.gameState.player2Score = 0;
                            this.updateRemoteScore();
                            break;
                        case 'game-state':
                            // Detect paddle-hit sound by checking plane crossing since last state
                            if (this.onlineGameState.prevBallX !== null) {
                                const prevX = this.onlineGameState.prevBallX;
                                const leftPlane = 50 + 15 + 10; // leftPaddleX + paddleWidth + radius
                                const rightPlane = 735 - 10; // rightPaddleX - radius
                                const crossedLeft = prevX > leftPlane && data.ballX <= leftPlane &&
                                    data.ballY >= data.leftPaddleY && data.ballY <= data.leftPaddleY + 100;
                                const crossedRight = prevX < rightPlane && data.ballX >= rightPlane &&
                                    data.ballY >= data.rightPaddleY && data.ballY <= data.rightPaddleY + 100;
                                if (crossedLeft || crossedRight)
                                    this.playPaddleHit();
                            }
                            // Detect scoring sound by checking if scores increased
                            const prevPlayer1Score = this.onlineGameState.gameState.player1Score;
                            const prevPlayer2Score = this.onlineGameState.gameState.player2Score;
                            if (data.player1Score > prevPlayer1Score || data.player2Score > prevPlayer2Score) {
                                this.playScoreSound();
                            }
                            this.onlineGameState.prevBallX = data.ballX;
                            this.onlineGameState.prevBallY = data.ballY;
                            // Update game state
                            this.onlineGameState.gameState.ballX = data.ballX;
                            this.onlineGameState.gameState.ballY = data.ballY;
                            this.onlineGameState.gameState.leftPaddleY = data.leftPaddleY;
                            this.onlineGameState.gameState.rightPaddleY = data.rightPaddleY;
                            this.onlineGameState.gameState.player1Score = data.player1Score;
                            this.onlineGameState.gameState.player2Score = data.player2Score;
                            this.updateRemoteScore();
                            this.hideRemoteGameMessage();
                            // Redraw the game with updated positions
                            this.drawRemoteGame();
                            // Fallback: Check for game over if server doesn't send game-over message
                            if (data.player1Score >= 5 || data.player2Score >= 5) {
                                console.log('🎯 Fallback: Game over detected in game-state message');
                                this.onlineGameState.gameFinished = true;
                                const winner = data.player1Score >= 5 ? data.player1Username : data.player2Username;
                                const winnerScore = data.player1Score >= 5 ? data.player1Score : data.player2Score;
                                const loserScore = data.player1Score >= 5 ? data.player2Score : data.player1Score;
                                this.onlineGameState.gameFinished = true;
<<<<<<< HEAD
                                // Play end game sound
                                this.playEndGameSound();
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
                                this.showGameOverScreen({
                                    winner: winner,
                                    winnerScore: winnerScore,
                                    loserScore: loserScore,
                                    player1Username: data.player1Username,
                                    player2Username: data.player2Username
                                });
                                // Refresh user data to update dashboard
                                this.refreshUserData();
                            }
                            break;
                        case 'game-over':
                            console.log('Game abandoned due to disconnect:', data);
                            this.onlineGameState.gameFinished = true;
                            this.onlineGameState.gameState.player1Score = data.player1Score;
                            this.onlineGameState.gameState.player2Score = data.player2Score;
                            this.updateRemoteScore();
<<<<<<< HEAD
                            // Play end game sound
                            this.playEndGameSound();
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
                            // Prepare game over screen data
                            const gameOverScreenDataD = {
                                winner: data.winnerAlias || data.winner,
                                winnerScore: Math.max(data.player1Score, data.player2Score),
                                loserScore: Math.min(data.player1Score, data.player2Score),
                                player1Username: data.player1Username,
                                player2Username: data.player2Username,
                                player1Score: data.player1Score,
                                player2Score: data.player2Score
                            };
                            // Show game over screen
                            this.showGameOverScreen(gameOverScreenDataD);
<<<<<<< HEAD
                            // Show power-ups toggle when remote game ends
                            this.showPowerupsToggle('online');
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
                            // Update game status
                            this.updateRemoteGameStatus('Game Over', `${data.winnerAlias} wins!`);
                            // Refresh user data to update dashboard
                            this.refreshUserData();
                            break;
                        case 'error':
                            console.log(`🚨 Server Error: ${data.message}`);
                            if (data.message === 'You are already in this match!') {
                                this.updateRemoteGameStatus('Error', 'You are already in this match! Please wait for another player.');
                                // Close the connection
                                if (this.onlineGameState.gameSocket) {
                                    this.onlineGameState.gameSocket.close();
                                }
                                // Retry connection after a delay
                                console.log('🔄 Will retry connection in 3 seconds...');
                                setTimeout(() => {
                                    console.log('🔄 Retrying connection...');
                                    this.connectToRemoteGame();
                                }, 3000);
                            }
                            else {
                                this.updateRemoteGameStatus('Error', data.message);
                            }
                            break;
                        default:
                            console.log(`❓ Unknown message type: ${data.type}`);
                    }
                }
                catch (e) {
                    console.log(`📨 Received raw message: ${event.data}`);
                }
            };
            this.onlineGameState.gameSocket.onclose = (event) => {
                console.log(`🔌 Remote game connection closed: ${event.code} ${event.reason}`);
                this.onlineGameState.isConnected = false;
                // Only show disconnect message if game wasn't finished
                if (this.onlineGameState.gameFinished) {
                    console.log('Game finished normally, not showing disconnect message');
                    return;
                }
                if (event.code === 1008 || event.code === 1011) {
                    console.log('Connection closed due to server error - not retrying');
                    this.updateRemoteGameStatus('Connection Error', 'Please refresh the page to reconnect.');
                    return;
                }
                // Check for normal closure codes
                if (event.code === 1000 && (event.reason === 'Game completed normally' || event.reason === 'Match is full')) {
                    console.log('WebSocket closed normally:', event.reason);
                    return;
                }
                // Only show disconnect message for unexpected closures
                if (event.code !== 1000 && event.code !== 1008 && event.code !== 1011) {
                    this.updateRemoteGameStatus('Disconnected', `Connection closed: ${event.reason || 'No reason provided'}`);
                    // Show a message that the game was abandoned
                    this.showRemoteGameMessage('Game abandoned - opponent disconnected');
                }
            };
            this.onlineGameState.gameSocket.onerror = (error) => {
                console.log('🚨 Remote game WebSocket error occurred');
                this.updateRemoteGameStatus('Error', 'WebSocket connection failed');
                console.error('WebSocket error:', error);
            };
        }
        catch (error) {
            console.log(`❌ Failed to create remote game WebSocket: ${error.message}`);
            this.updateRemoteGameStatus('Error', 'Failed to create WebSocket connection');
        }
    }
    updateRemoteGameStatus(status, info, hideConnectButton = false) {
        const statusElement = document.getElementById('matchmakingStatus');
        const connectBtn = document.getElementById('connectRemoteBtn');
        if (statusElement) {
            const showSpinner = info.includes('Waiting') || info.includes('Searching');
            const icon = status === 'Connected' ? '✅' : status === 'Error' ? '❌' : status === 'Searching' ? '🔍' : '🔌';
            const color = status === 'Connected' ? 'text-powerpuff-green' : status === 'Error' ? 'text-powerpuff-red' : status === 'Searching' ? 'text-powerpuff-blue' : 'text-white';
            statusElement.innerHTML = `
                <div class="text-center">
                    <div class="text-3xl mb-4">${icon}</div>
                    <h3 class="text-xl font-bold mb-2 ${color}">${status}</h3>
                    <p class="text-sm text-gray-300">${info}</p>
                    ${showSpinner ? '<div class="mt-4"><div class="animate-spin rounded-full h-16 w-16 border-4 border-powerpuff-green border-t-transparent mx-auto shadow-lg"></div><div class="mt-2 text-sm text-gray-300">Searching for players...</div></div>' : ''}
                </div>
            `;
            statusElement.style.display = 'block';
        }
        if (connectBtn) {
            if (hideConnectButton) {
                connectBtn.style.display = 'none';
            }
            else {
                connectBtn.style.display = 'block';
            }
        }
    }
    updateRemoteScore() {
        const player1Score = document.getElementById('onlinePlayer1Score');
        const player2Score = document.getElementById('onlinePlayer2Score');
        const scoreDisplay = document.getElementById('onlineScoreDisplay');
        console.log('=== SCORE UPDATE DEBUG ===');
        console.log('Score values:', {
            player1Score: this.onlineGameState.gameState.player1Score,
            player2Score: this.onlineGameState.gameState.player2Score
        });
        console.log('DOM elements:', {
            player1Element: !!player1Score,
            player2Element: !!player2Score,
            scoreDisplayElement: !!scoreDisplay
        });
        if (scoreDisplay) {
            console.log('Score display styles:', {
                display: scoreDisplay.style.display,
                visibility: scoreDisplay.style.visibility,
                opacity: scoreDisplay.style.opacity,
                computedDisplay: window.getComputedStyle(scoreDisplay).display,
                computedVisibility: window.getComputedStyle(scoreDisplay).visibility,
                offsetHeight: scoreDisplay.offsetHeight,
                offsetWidth: scoreDisplay.offsetWidth
            });
        }
        if (player1Score && player2Score) {
            // Force the score display to be visible
            if (scoreDisplay) {
                scoreDisplay.style.display = 'block';
                scoreDisplay.style.visibility = 'visible';
                scoreDisplay.style.opacity = '1';
                scoreDisplay.style.textAlign = 'center';
            }
            // Update the scores
            player1Score.textContent = this.onlineGameState.gameState.player1Score.toString();
            player2Score.textContent = this.onlineGameState.gameState.player2Score.toString();
            console.log('Updated scores to:', {
                player1Text: player1Score.textContent,
                player2Text: player2Score.textContent
            });
            // Double-check visibility after update
            if (scoreDisplay) {
                console.log('After update - Score display styles:', {
                    display: scoreDisplay.style.display,
                    computedDisplay: window.getComputedStyle(scoreDisplay).display,
                    offsetHeight: scoreDisplay.offsetHeight
                });
            }
        }
        else {
            console.error('Score elements not found!');
        }
    }
    showRemoteGameMessage(message) {
        const gameMessage = document.getElementById('onlineGameMessage');
        const gameOverlay = document.getElementById('onlineGameOverlay');
        if (gameMessage) {
            gameMessage.textContent = message;
        }
        if (gameOverlay) {
            gameOverlay.style.display = 'flex';
        }
    }
    hideRemoteGameMessage() {
        const gameOverlay = document.getElementById('onlineGameOverlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
        }
    }
    setupRemoteGameInput() {
        const handleKeyDown = (event) => {
            if (!this.onlineGameState.gameSocket || this.onlineGameState.gameSocket.readyState !== WebSocket.OPEN)
                return;
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.sendRemoteInput('keydown', 'up');
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.sendRemoteInput('keydown', 'down');
                    event.preventDefault();
                    break;
            }
        };
        const handleKeyUp = (event) => {
            if (!this.onlineGameState.gameSocket || this.onlineGameState.gameSocket.readyState !== WebSocket.OPEN)
                return;
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.sendRemoteInput('keyup', 'up');
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.sendRemoteInput('keyup', 'down');
                    event.preventDefault();
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }
    sendRemoteInput(inputType, key) {
        if (this.onlineGameState.gameSocket && this.onlineGameState.gameSocket.readyState === WebSocket.OPEN) {
            const message = {
                type: 'input',
                inputType: inputType,
                key: key
            };
            this.onlineGameState.gameSocket.send(JSON.stringify(message));
            console.log(`Sent remote input: ${inputType} ${key}`);
        }
    }
    updatePlayerNames(player1Name, player2Name) {
        const player1NameElement = document.getElementById('onlinePlayer1Name');
        const player2NameElement = document.getElementById('onlinePlayer2Name');
        console.log(`🎮 Updating player names - Player ${this.onlineGameState.playerNumber}:`);
        console.log(`   Player1Name: ${player1Name}, Player2Name: ${player2Name}`);
        // Simply update the names directly like the working backend/public/index.html
        if (player1NameElement && player2NameElement) {
            player1NameElement.textContent = player1Name;
            player2NameElement.textContent = player2Name;
            console.log(`   Updated names: ${player1Name} vs ${player2Name}`);
        }
        else {
            console.error('❌ Player name elements not found!');
        }
    }
    showWaitingForOpponent() {
        const statusElement = document.getElementById('matchmakingStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="text-center">
                    <div class="text-3xl mb-4">⏳</div>
                    <h3 class="text-xl font-bold mb-2 text-powerpuff-blue">Waiting for opponent...</h3>
                    <div class="mt-4">
                        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-powerpuff-blue mx-auto shadow-lg"></div>
                        <p class="text-sm text-gray-300 mt-2">Waiting for second player to join...</p>
                    </div>
                </div>
            `;
            statusElement.style.display = 'block';
        }
    }
    hideWaitingForOpponent() {
        const statusElement = document.getElementById('matchmakingStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }
    showCountdown(count) {
        const gameOverlay = document.getElementById('onlineGameOverlay');
        const gameMessage = document.getElementById('onlineGameMessage');
        if (gameOverlay && gameMessage) {
            gameOverlay.style.display = 'flex';
            gameMessage.innerHTML = `
                <div class="text-center">
                    <div class="text-6xl font-bold text-powerpuff-green mb-4">${count}</div>
                    <div class="text-xl text-white">Game starting...</div>
                </div>
            `;
        }
    }
    hideCountdown() {
        const gameOverlay = document.getElementById('onlineGameOverlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
        }
    }
    startRemoteGame() {
        console.log('🎮 Starting remote game...');
        // Show the score display
        const scoreDisplay = document.querySelector('#onlineGameSection .text-center.text-white.mb-8');
        if (scoreDisplay) {
            scoreDisplay.style.display = 'block';
        }
        // Show the game canvas
        const gameContainer = document.querySelector('#onlineGameSection .flex.justify-center.mb-8');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
        // Hide matchmaking status
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        if (matchmakingStatus) {
            matchmakingStatus.style.display = 'none';
        }
        // Initialize the game canvas
        this.initializeRemoteGameCanvas();
        // Set up input handling
        this.setupRemoteGameInput();
        console.log('🎮 Remote game started successfully');
    }
    showScoreDisplay() {
        console.log('🎮 showScoreDisplay called');
        const scoreDisplay = document.getElementById('onlineScoreDisplay');
        console.log('🎮 Score display element found:', !!scoreDisplay);
        if (scoreDisplay) {
            console.log('🎮 Current display style:', scoreDisplay.style.display);
            scoreDisplay.style.display = 'block';
            scoreDisplay.style.textAlign = 'center';
            console.log('🎮 Set display to block and text-align to center');
            console.log('🎮 Score display shown');
        }
        else {
            console.error('❌ Score display element not found');
        }
    }
    hideScoreDisplay() {
        const scoreDisplay = document.getElementById('onlineScoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.style.display = 'none';
            console.log('🎮 Score display hidden');
        }
    }
    reconnectToRemoteGame() {
        console.log('Reconnecting to remote game...');
        // Reset game state
        this.onlineGameState.gameFinished = false;
        this.onlineGameState.gameState = {
            ballX: 400,
            ballY: 300,
            leftPaddleY: 250,
            rightPaddleY: 250,
            player1Score: 0,
            player2Score: 0,
            speedX: 5,
            speedY: 3
        };
        // Close existing connection
        if (this.onlineGameState.gameSocket) {
            this.onlineGameState.gameSocket.close();
        }
        // Reset connection state
        this.onlineGameState.isConnected = false;
        this.onlineGameState.playerNumber = null;
        // Reconnect after a short delay
        setTimeout(() => {
            this.connectToRemoteGame();
        }, 1000);
    }
    showGameOverScreen(data) {
        // Show the game over modal
        const gameOverModal = document.getElementById('gameOverModal');
        const gameOverIcon = document.getElementById('gameOverIcon');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');
        const gameOverPlayer1Name = document.getElementById('gameOverPlayer1Name');
        const gameOverPlayer2Name = document.getElementById('gameOverPlayer2Name');
        const gameOverPlayer1Score = document.getElementById('gameOverPlayer1Score');
        const gameOverPlayer2Score = document.getElementById('gameOverPlayer2Score');
        if (gameOverModal && gameOverIcon && gameOverTitle && gameOverMessage) {
            // Determine if current user won
            const currentUsername = this.currentUser?.username;
            let isWinner = false;
            if (data.winner === currentUsername || data.winnerAlias === currentUsername) {
                isWinner = true;
            }
            else if (data.player1Username === currentUsername && data.player1Score > data.player2Score) {
                isWinner = true;
            }
            else if (data.player2Username === currentUsername && data.player2Score > data.player1Score) {
                isWinner = true;
            }
            // Set appropriate icon and message
            gameOverIcon.textContent = isWinner ? '🏆' : '💔';
            gameOverTitle.textContent = isWinner ? 'Victory!' : 'Defeat!';
            gameOverMessage.textContent = isWinner ? 'Congratulations, you won!' : `${data.winner} wins!`;
            // Set player names and scores
            if (gameOverPlayer1Name && gameOverPlayer2Name && gameOverPlayer1Score && gameOverPlayer2Score) {
                gameOverPlayer1Name.textContent = data.player1Username || 'Player 1';
                gameOverPlayer2Name.textContent = data.player2Username || 'Player 2';
                gameOverPlayer1Score.textContent = data.player1Score?.toString() || '0';
                gameOverPlayer2Score.textContent = data.player2Score?.toString() || '0';
            }
            // Show the modal
            gameOverModal.classList.remove('hidden');
            // Set up button event listeners
            const playAgainBtn = document.getElementById('playAgainBtn');
            const goHomeBtn = document.getElementById('goHomeBtn');
            if (playAgainBtn)
                playAgainBtn.style.display = 'none';
            if (goHomeBtn) {
                // Remove existing listeners
                const newGoHomeBtn = goHomeBtn.cloneNode(true);
                goHomeBtn.parentNode?.replaceChild(newGoHomeBtn, goHomeBtn);
                newGoHomeBtn.classList.add('w-full');
                newGoHomeBtn.textContent = '🏠 Return to Home';
                newGoHomeBtn.onclick = () => {
                    console.log('Go Home clicked');
                    // Close WebSocket if still open
                    if (this.onlineGameState.gameSocket) {
                        this.onlineGameState.gameSocket.close(1000, 'User chose to go home');
                    }
                    // Close modal and go home
                    gameOverModal.classList.add('hidden');
                    this.goHome();
                };
            }
        }
    }
    restartRemoteGame() {
        console.log('Restarting remote game...');
        // Reset game state
        this.onlineGameState.gameState = {
            ballX: 400,
            ballY: 300,
            leftPaddleY: 250,
            rightPaddleY: 250,
            player1Score: 0,
            player2Score: 0,
            speedX: 5,
            speedY: 3
        };
        // Update score display
        this.updateRemoteScore();
        // Hide game over screen and score display
        this.hideRemoteGameMessage();
        this.hideScoreDisplay();
        // Reconnect to game
        if (this.onlineGameState.gameSocket) {
            this.onlineGameState.gameSocket.close();
        }
        setTimeout(() => {
            this.connectToRemoteGame();
        }, 1000);
    }
    goHome() {
        // Prevent multiple calls
        if (this.isGoingHome) {
            console.log('Already going home, ignoring duplicate call');
            return;
        }
        this.isGoingHome = true;
        console.log('Going home...');
        // Close remote game connection if active
        if (this.onlineGameState.gameSocket)
            this.onlineGameState.gameSocket.close();
        // Reset remote game state
        this.onlineGameState = {
            matchmakingSocket: null,
            gameSocket: null,
            matchId: '1',
            playerNumber: null,
            isConnected: false,
            isInMatch: false,
            gameFinished: false,
            gameState: {
                ballX: 400,
                ballY: 300,
                leftPaddleY: 250,
                rightPaddleY: 250,
                player1Score: 0,
                player2Score: 0,
                speedX: 5,
                speedY: 3
            }
        };
        // Reset local game state
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        this.resetGameState();
        // Clear tournament match reference
        this.currentTournamentMatch = null;
        // Restore original endGame method if it was overridden
        if (this.originalEndGame) {
            this.endGame = this.originalEndGame;
            this.originalEndGame = null;
        }
        // Hide all game overlays and modals
        this.hideScoreDisplay();
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.classList.add('hidden');
        }
        // Close customization modal if open
        this.hideCustomizationModal();
        // Hide game section
        const gameSection = document.getElementById('gameSection');
        if (gameSection) {
            gameSection.classList.remove('active');
        }
        // Show home section
        this.showSection('homeSection');
        // Reset the flag after a short delay
        setTimeout(() => {
            this.isGoingHome = false;
        }, 1000);
        console.log('Successfully returned to home');
    }
    // REMOVED: Old matchmaking method - replaced by initializeRemoteGame
    /*
    private initializeOnlineGame(): void {
        
        // Initialize online game state
        this.onlineGameState = {
            matchmakingSocket: null,
            gameSocket: null,
            matchId: null,
            playerNumber: null,
            isConnected: false,
            isInMatch: false,
            gameState: {
                ballX: 400,
                ballY: 300,
                leftPaddleY: 250,
                rightPaddleY: 250,
                player1Score: 0,
                player2Score: 0,
                speedX: 5,
                speedY: 3
            }
        };

        // Set up matchmaking controls
        this.setupMatchmakingControls();
        
        // Start matchmaking automatically
        this.startMatchmaking();
    }
    */
    setupMatchmakingControls() {
        const cancelMatchmakingBtn = document.getElementById('cancelMatchmakingBtn');
        if (cancelMatchmakingBtn) {
            cancelMatchmakingBtn.addEventListener('click', () => {
                this.cancelMatchmaking();
            });
        }
    }
    startMatchmaking() {
        console.log('Starting matchmaking...');
        try {
            // Connect to matchmaking WebSocket
            const matchmakingSocket = new WebSocket('ws://10.11.1.6/api/matchmaking');
            matchmakingSocket.onopen = () => {
                console.log('Connected to matchmaking server');
                this.onlineGameState.matchmakingSocket = matchmakingSocket;
                this.onlineGameState.isConnected = true;
                // Send join queue message with user info
                const joinMessage = {
                    type: 'join-queue',
                    userId: this.currentUser.id,
                    username: this.currentUser.username
                };
                matchmakingSocket.send(JSON.stringify(joinMessage));
                this.updateMatchmakingStatus('Searching for opponent...', 'searching');
            };
            matchmakingSocket.onmessage = (event) => {
                console.log('Raw matchmaking message received:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    console.log('Parsed matchmaking message:', data);
                    if (data.type === 'match-found') {
                        console.log('Match found! Handling match...');
                        this.handleMatchFound(data);
                    }
                    else if (data.type === 'queue-status') {
                        console.log('Queue status update:', data.status);
                        this.updateMatchmakingStatus(`Players in queue: ${data.status.waitingPlayers}`, 'searching');
                    }
                    else if (data.type === 'joined-queue') {
                        console.log('Successfully joined queue');
                        this.updateMatchmakingStatus('Joined matchmaking queue. Searching for opponent...', 'searching');
                    }
                    else if (data.type === 'ping') {
                        console.log('Received ping from server');
                        // Send pong response to keep connection alive
                        matchmakingSocket.send(JSON.stringify({
                            type: 'pong',
                            timestamp: data.timestamp
                        }));
                    }
                    else {
                        console.log('Unknown message type:', data.type);
                    }
                }
                catch (error) {
                    console.error('Error parsing matchmaking message:', error);
                }
            };
            matchmakingSocket.onerror = (error) => {
                console.error('Matchmaking WebSocket error:', error);
                this.updateMatchmakingStatus('Connection error. Please try again.', 'error');
            };
            matchmakingSocket.onclose = (event) => {
                console.log('🔌 Matchmaking WebSocket closed:', event.code, event.reason);
                console.log('🔍 Close event details:', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean,
                    type: event.type
                });
                this.onlineGameState.isConnected = false;
                if (!this.onlineGameState.isInMatch) {
                    this.updateMatchmakingStatus(`Connection lost (Code: ${event.code}). Please try again.`, 'error');
                }
            };
        }
        catch (error) {
            console.error('Failed to start matchmaking:', error);
            this.updateMatchmakingStatus('Failed to connect to server. Retrying...', 'error');
            // Retry after 3 seconds
            setTimeout(() => {
                if (!this.onlineGameState.isConnected && !this.onlineGameState.isInMatch) {
                    console.log('Retrying matchmaking connection...');
                    this.startMatchmaking();
                }
            }, 3000);
        }
    }
    handleMatchFound(data) {
        console.log('=== HANDLING MATCH FOUND ===');
        console.log('Match data:', data);
        if (!data.matchId) {
            console.error('No matchId in match-found message');
            return;
        }
        this.onlineGameState.matchId = data.matchId;
        this.onlineGameState.isInMatch = true;
        console.log('Updated online game state:', this.onlineGameState);
        // Close matchmaking connection
        if (this.onlineGameState.matchmakingSocket) {
            console.log('Closing matchmaking socket...');
            this.onlineGameState.matchmakingSocket.close();
        }
        // Connect to game WebSocket
        console.log('Connecting to game with matchId:', data.matchId);
        this.connectToGame(data.matchId);
    }
    connectToGame(matchId) {
        console.log('Connecting to game:', matchId);
        try {
            const gameSocket = new WebSocket(`ws://10.11.1.6/api/remote-game/${matchId}`);
            gameSocket.onopen = () => {
                console.log('Connected to game server');
                this.onlineGameState.gameSocket = gameSocket;
                this.updateMatchmakingStatus('Connected to game!', 'connected');
            };
            gameSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Game message received:', data);
                if (data.type === 'success') {
                    this.handleGameSuccess(data);
                }
                else if (data.type === 'ready') {
                    this.handleGameReady(data);
                }
                else if (data.type === 'input-update') {
                    this.handleInputUpdate(data);
                }
                else if (data.type === 'disconnect') {
                    this.handlePlayerDisconnect(data);
                }
            };
            gameSocket.onerror = (error) => {
                console.error('Game WebSocket error:', error);
                this.updateMatchmakingStatus('Game connection error.', 'error');
            };
            gameSocket.onclose = () => {
                console.log('Game WebSocket closed');
                this.onlineGameState.isInMatch = false;
                this.updateMatchmakingStatus('Game ended.', 'ended');
            };
        }
        catch (error) {
            console.error('Failed to connect to game:', error);
            this.updateMatchmakingStatus('Failed to connect to game.', 'error');
        }
    }
    handleGameSuccess(data) {
        this.onlineGameState.playerNumber = data.playerNumber;
        this.updateMatchmakingStatus(`You are Player ${data.playerNumber}`, 'connected');
        // Update player names display
        const player1Name = document.getElementById('onlinePlayer1Name');
        const player2Name = document.getElementById('onlinePlayer2Name');
        if (player1Name)
            player1Name.textContent = data.player1Username || 'Player 1';
        if (player2Name)
            player2Name.textContent = data.player2Username || 'Player 2';
    }
    handleGameReady(data) {
        this.updateMatchmakingStatus('Both players ready! Game starting...', 'ready');
        // Show game canvas and hide matchmaking
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        const scoreDisplay = document.querySelector('.text-center.text-white.mb-8');
        const gameContainer = document.querySelector('.flex.justify-center.mb-8');
        if (matchmakingStatus)
            matchmakingStatus.style.display = 'none';
        if (scoreDisplay)
            scoreDisplay.style.display = 'block';
        if (gameContainer)
            gameContainer.style.display = 'flex';
        // Initialize online game canvas
        this.initializeOnlineGameCanvas();
    }
    handleInputUpdate(data) {
        // Handle real-time game state updates
        console.log('Input update:', data);
        // This will be implemented when we add the actual game rendering
    }
    handlePlayerDisconnect(data) {
        this.updateMatchmakingStatus('Opponent disconnected.', 'error');
        this.onlineGameState.isInMatch = false;
        // Show matchmaking again
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        if (matchmakingStatus)
            matchmakingStatus.style.display = 'block';
    }
    cancelMatchmaking() {
        if (this.onlineGameState.matchmakingSocket) {
            this.onlineGameState.matchmakingSocket.close();
        }
        this.updateMatchmakingStatus('Matchmaking cancelled.', 'cancelled');
        // Show home button
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        if (matchmakingStatus) {
            const homeBtn = document.createElement('button');
            homeBtn.className = 'bg-powerpuff-blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors shadow-lg mt-4';
            homeBtn.textContent = '🏠 Go Home';
            homeBtn.addEventListener('click', () => {
                this.showSection('homeSection');
            });
            matchmakingStatus.appendChild(homeBtn);
        }
    }
    updateMatchmakingStatus(message, status) {
        const statusElement = document.getElementById('matchmakingStatus');
        if (!statusElement)
            return;
        let icon = '🔍';
        let color = 'text-white';
        let showSpinner = false;
        switch (status) {
            case 'searching':
                icon = '🔍';
                color = 'text-powerpuff-green';
                showSpinner = true;
                break;
            case 'connected':
                icon = '✅';
                color = 'text-powerpuff-green';
                showSpinner = false;
                break;
            case 'ready':
                icon = '🎮';
                color = 'text-powerpuff-green';
                showSpinner = false;
                break;
            case 'error':
                icon = '❌';
                color = 'text-powerpuff-red';
                showSpinner = false;
                break;
            case 'cancelled':
                icon = '🚫';
                color = 'text-gray-400';
                showSpinner = false;
                break;
            case 'ended':
                icon = '🏁';
                color = 'text-gray-400';
                showSpinner = false;
                break;
        }
        statusElement.innerHTML = `
            <div class="text-3xl mb-4">${icon}</div>
            <h3 class="text-xl font-bold mb-2 ${color}">${message}</h3>
            ${showSpinner ? '<div class="mt-4"><div class="animate-spin rounded-full h-16 w-16 border-4 border-powerpuff-green border-t-transparent mx-auto shadow-lg"></div><div class="mt-2 text-sm text-gray-300">Searching for players...</div></div>' : ''}
        `;
    }
    initializeOnlineGameCanvas() {
        const canvas = document.getElementById('onlineGameCanvas');
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // Set up canvas for online game
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Add game controls
        this.setupOnlineGameControls();
    }
    setupOnlineGameControls() {
        // Handle keyboard input for online game
        document.addEventListener('keydown', (e) => {
            if (!this.onlineGameState.gameSocket || !this.onlineGameState.isInMatch)
                return;
            let key = '';
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                key = 'up';
            }
            else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                key = 'down';
            }
            else {
                return;
            }
            const inputMessage = {
                type: 'input',
                inputType: 'keydown',
                key: key
            };
            this.onlineGameState.gameSocket.send(JSON.stringify(inputMessage));
        });
        document.addEventListener('keyup', (e) => {
            if (!this.onlineGameState.gameSocket || !this.onlineGameState.isInMatch)
                return;
            let key = '';
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                key = 'up';
            }
            else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                key = 'down';
            }
            else {
                return;
            }
            const inputMessage = {
                type: 'input',
                inputType: 'keyup',
                key: key
            };
            this.onlineGameState.gameSocket.send(JSON.stringify(inputMessage));
        });
    }
    // AI Pong Game Methods
    initializeAIGame() {
        console.log('Initializing AI Pong game...');
<<<<<<< HEAD
        // Setup power-ups toggle
        this.setupPowerupsToggle();
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        // Connect to AI game WebSocket
        this.connectAIGame();
        // Setup keyboard controls
        this.setupAIKeyboardControls();
    }
    setupAIKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w' || e.key === 'W') {
                this.aiGameKeys.w = true;
                e.preventDefault();
            }
            if (e.key === 's' || e.key === 'S') {
                this.aiGameKeys.s = true;
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'w' || e.key === 'W') {
                this.aiGameKeys.w = false;
                e.preventDefault();
            }
            if (e.key === 's' || e.key === 'S') {
                this.aiGameKeys.s = false;
                e.preventDefault();
            }
        });
    }
<<<<<<< HEAD
    setupPowerupsToggle() {
        console.log('Setting up power-ups toggle...');
        const powerupsToggle = document.getElementById('powerupsToggle');
        const powerupsStatus = document.getElementById('powerupsStatus');
        if (!powerupsToggle || !powerupsStatus) {
            console.error('Power-ups toggle elements not found');
            return;
        }
        this.setupPowerupsToggleForElement(powerupsToggle, powerupsStatus, 'ai');
        console.log('Power-ups toggle setup complete');
    }
    setupAllPowerupsToggles() {
        console.log('Setting up all power-ups toggles...');
        // AI Game toggle
        const aiToggle = document.getElementById('powerupsToggle');
        const aiStatus = document.getElementById('powerupsStatus');
        if (aiToggle && aiStatus) {
            this.setupPowerupsToggleForElement(aiToggle, aiStatus, 'ai');
        }
        // 1v1 Game toggle
        const toggle1v1 = document.getElementById('powerupsToggle1v1');
        const status1v1 = document.getElementById('powerupsStatus1v1');
        console.log('1v1 toggle elements found:', !!toggle1v1, !!status1v1);
        if (toggle1v1 && status1v1) {
            this.setupPowerupsToggleForElement(toggle1v1, status1v1, '1v1');
        }
        else {
            console.error('1v1 toggle elements not found!');
        }
        // Tournament toggle
        const toggleTournament = document.getElementById('powerupsToggleTournament');
        const statusTournament = document.getElementById('powerupsStatusTournament');
        if (toggleTournament && statusTournament) {
            this.setupPowerupsToggleForElement(toggleTournament, statusTournament, 'tournament');
        }
        // Online Game toggle
        const toggleOnline = document.getElementById('powerupsToggleOnline');
        const statusOnline = document.getElementById('powerupsStatusOnline');
        if (toggleOnline && statusOnline) {
            this.setupPowerupsToggleForElement(toggleOnline, statusOnline, 'online');
        }
        console.log('All power-ups toggles setup complete');
    }
    setupPowerupsToggleForElement(toggle, status, gameMode) {
        console.log(`Setting up power-ups toggle for ${gameMode}`);
        // Load saved preference from localStorage
        const savedPowerupsEnabled = localStorage.getItem(`powerupsEnabled_${gameMode}`);
        const powerupsEnabled = savedPowerupsEnabled !== null ? savedPowerupsEnabled === 'true' : true; // Default to true
        console.log(`Loaded preference for ${gameMode}:`, savedPowerupsEnabled, 'enabled:', powerupsEnabled);
        // Set initial state
        toggle.checked = powerupsEnabled;
        this.updatePowerupsStatusForElement(status, powerupsEnabled);
        // Update game state immediately if it exists
        if (this.gameState) {
            this.gameState.powerupsEnabled = powerupsEnabled;
            console.log(`Game state powerupsEnabled set to: ${powerupsEnabled} for ${gameMode}`);
        }
        // Add event listener for toggle changes
        toggle.addEventListener('change', (e) => {
            const target = e.target;
            const enabled = target.checked;
            // Save preference to localStorage
            localStorage.setItem(`powerupsEnabled_${gameMode}`, enabled.toString());
            console.log(`Power-ups preference saved for ${gameMode}:`, enabled);
            // Update status display
            this.updatePowerupsStatusForElement(status, enabled);
            // Note: Power-ups are handled entirely on the frontend
            // No need to communicate with backend for this preference
            // Update local game state for 1v1 games
            if (gameMode === '1v1' && this.gameState) {
                this.gameState.powerupsEnabled = enabled;
                console.log('Power-ups preference updated for 1v1 game:', enabled);
                console.log('Current gameState.powerupsEnabled:', this.gameState.powerupsEnabled);
            }
            // Update tournament game state
            if (gameMode === 'tournament' && this.gameState) {
                this.gameState.powerupsEnabled = enabled;
                console.log('Power-ups preference updated for tournament game:', enabled);
                console.log('Current gameState.powerupsEnabled:', this.gameState.powerupsEnabled);
            }
            // Update the game state immediately if it exists
            if (this.gameState) {
                this.gameState.powerupsEnabled = enabled;
                console.log(`Game state powerupsEnabled updated to: ${enabled}`);
            }
        });
    }
    updatePowerupsStatus(enabled) {
        const powerupsStatus = document.getElementById('powerupsStatus');
        if (powerupsStatus) {
            this.updatePowerupsStatusForElement(powerupsStatus, enabled);
        }
    }
    updatePowerupsStatusForElement(statusElement, enabled) {
        if (enabled) {
            statusElement.textContent = 'Enabled';
            statusElement.className = 'text-powerpuff-pink font-semibold';
        }
        else {
            statusElement.textContent = 'Disabled';
            statusElement.className = 'text-gray-400 font-semibold';
        }
    }
    hidePowerupsToggle(gameMode) {
        let toggleContainer = null;
        switch (gameMode) {
            case '1v1':
                toggleContainer = document.querySelector('#gameSection .mb-8:nth-of-type(2)');
                break;
            case 'tournament':
                toggleContainer = document.querySelector('#localTournamentSection .mb-8:nth-of-type(2)');
                break;
            case 'ai':
                toggleContainer = document.querySelector('#aiPongSection .mb-8:nth-of-type(2)');
                break;
            case 'online':
                toggleContainer = document.querySelector('#onlineGameSection .mb-8:nth-of-type(2)');
                break;
        }
        if (toggleContainer) {
            toggleContainer.style.display = 'none';
            console.log(`Power-ups toggle hidden for ${gameMode}`);
        }
    }
    showPowerupsToggle(gameMode) {
        let toggleContainer = null;
        switch (gameMode) {
            case '1v1':
                toggleContainer = document.querySelector('#gameSection .mb-8:nth-of-type(2)');
                break;
            case 'tournament':
                toggleContainer = document.querySelector('#localTournamentSection .mb-8:nth-of-type(2)');
                break;
            case 'ai':
                toggleContainer = document.querySelector('#aiPongSection .mb-8:nth-of-type(2)');
                break;
            case 'online':
                toggleContainer = document.querySelector('#onlineGameSection .mb-8:nth-of-type(2)');
                break;
        }
        if (toggleContainer) {
            toggleContainer.style.display = 'block';
            console.log(`Power-ups toggle shown for ${gameMode}`);
        }
    }
    resetTournamentState() {
        console.log('🔄 Resetting tournament state and UI...');
        // Reset tournament state
        this.tournamentState = {
            players: [],
            currentRound: 0,
            currentMatch: 0,
            matches: [],
            bracket: []
        };
        // Clear tournament UI elements
        const bracketContainer = document.getElementById('tournamentBracket');
        if (bracketContainer) {
            bracketContainer.innerHTML = '';
        }
        const currentMatchDiv = document.getElementById('currentMatch');
        if (currentMatchDiv) {
            currentMatchDiv.classList.add('hidden');
        }
        const matchInfo = document.getElementById('matchInfo');
        if (matchInfo) {
            matchInfo.innerHTML = '';
        }
        const resultsDiv = document.getElementById('tournamentResults');
        if (resultsDiv) {
            resultsDiv.classList.add('hidden');
        }
        const resultsInfo = document.getElementById('resultsInfo');
        if (resultsInfo) {
            resultsInfo.innerHTML = '';
        }
        // Show the tournament setup section
        const tournamentSetup = document.getElementById('tournamentSetup');
        if (tournamentSetup) {
            tournamentSetup.classList.remove('hidden');
        }
        console.log('✅ Tournament state and UI reset complete');
    }
    cleanupGameState() {
        console.log('🧹 Cleaning up game state...');
        // Stop any running game loop
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
            console.log('🧹 Game loop stopped');
        }
        // Reset game state
        this.resetGameState();
        // Clean up tournament state if running
        if (this.currentTournamentMatch) {
            console.log('🧹 Cleaning up tournament state...');
            this.currentTournamentMatch = null;
            // Restore original endGame method if it was overridden
            if (this.originalEndGame) {
                this.endGame = this.originalEndGame;
                this.originalEndGame = null;
            }
            // Reset tournament state and UI
            this.resetTournamentState();
        }
        // Show power-ups toggles
        this.showPowerupsToggle('1v1');
        this.showPowerupsToggle('tournament');
        console.log('✅ Game state cleanup complete');
    }
    initializeAudio() {
        // Preload paddle hit sound, score sound, and end game sound
        try {
            this.paddleHitAudio = new Audio('/imgs/Ping-pong-ball-bouncing.mp3');
            this.paddleHitAudio.preload = 'auto';
            this.scoreAudio = new Audio('/imgs/point-smooth-beep-230573.mp3');
            this.scoreAudio.preload = 'auto';
            this.endGameAudio = new Audio('/imgs/077512_end-game-90582.mp3');
            this.endGameAudio.preload = 'auto';
            // Attempt to unlock on first user interaction
            const unlock = () => {
                if (!this.paddleHitAudio || !this.scoreAudio || !this.endGameAudio)
                    return;
                this.paddleHitAudio.muted = true;
                this.scoreAudio.muted = true;
                this.endGameAudio.muted = true;
                this.paddleHitAudio.play().catch(() => { });
                this.scoreAudio.play().catch(() => { });
                this.endGameAudio.play().catch(() => { });
                this.paddleHitAudio.pause();
                this.scoreAudio.pause();
                this.endGameAudio.pause();
                this.paddleHitAudio.currentTime = 0;
                this.scoreAudio.currentTime = 0;
                this.endGameAudio.currentTime = 0;
                this.paddleHitAudio.muted = false;
                this.scoreAudio.muted = false;
                this.endGameAudio.muted = false;
                window.removeEventListener('click', unlock);
                window.removeEventListener('touchstart', unlock);
            };
            window.addEventListener('click', unlock, { once: true });
            window.addEventListener('touchstart', unlock, { once: true });
            console.log('Audio files initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize audio files:', error);
        }
    }
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
    connectAIGame() {
        try {
            this.aiGameWs = new WebSocket(`wss://${HOST_IP}/api/ai-game`);
            this.aiGameWs.onopen = () => {
                this.logAIGame('Connected to AI Pong Game!');
            };
            this.aiGameWs.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleAIGameMessage(data);
                }
                catch (error) {
                    console.error('Error parsing AI game message:', error);
                }
            };
            this.aiGameWs.onclose = () => {
                this.logAIGame('Disconnected from AI Pong Game');
            };
            this.aiGameWs.onerror = (error) => {
                console.error('AI Game WebSocket error:', error);
                this.logAIGame('Connection error occurred');
            };
        }
        catch (error) {
            console.error('Error connecting to AI game:', error);
            this.logAIGame('Failed to connect to AI game');
        }
    }
    startAIGame() {
        if (this.aiGameWs && this.aiGameWs.readyState === WebSocket.OPEN) {
            this.aiGameWs.send(JSON.stringify({ type: 'start-game' }));
            this.logAIGame('Starting game...');
        }
    }
    pauseAIGame() {
        if (this.aiGameWs && this.aiGameWs.readyState === WebSocket.OPEN) {
            this.aiGameWs.send(JSON.stringify({ type: 'pause-game' }));
        }
    }
    restartAIGame() {
        if (this.aiGameWs && this.aiGameWs.readyState === WebSocket.OPEN) {
            this.aiGameWs.send(JSON.stringify({ type: 'restart-game' }));
            this.logAIGame('Restarting game...');
            this.aiGameState.gameStarted = false;
        }
    }
    handleAIGameMessage(data) {
        console.log('AI Game message received:', data);
        switch (data.type) {
            case 'connection-established':
                this.logAIGame(data.message);
                break;
            case 'game-state':
                // Only update non-ball related state before game starts
                if (data.gameState) {
                    // Update only non-ball properties before game starts
                    if (data.gameState.currentDifficulty) {
                        this.aiGameState.currentDifficulty = data.gameState.currentDifficulty;
                    }
                    if (data.gameState.playerScore !== undefined) {
                        this.aiGameState.playerScore = data.gameState.playerScore;
                    }
                    if (data.gameState.aiScore !== undefined) {
                        this.aiGameState.aiScore = data.gameState.aiScore;
                    }
                    // Only update ball and paddle positions if game is started
                    if (this.aiGameState.gameStarted) {
                        this.aiGameState = { ...this.aiGameState, ...data.gameState };
                    }
                }
                if (data.availableDifficulties) {
                    this.aiGameAvailableDifficulties = data.availableDifficulties.reduce((acc, diff) => {
                        acc[diff.key] = diff;
                        return acc;
                    }, {});
                }
                this.updateAIScore();
                if (this.aiGameState.currentDifficulty && this.aiGameAvailableDifficulties[this.aiGameState.currentDifficulty]) {
                    this.updateAIDifficultyDisplay(this.aiGameState.currentDifficulty, this.aiGameAvailableDifficulties[this.aiGameState.currentDifficulty]);
                }
                break;
            case 'difficulty-changed':
                this.aiGameState.currentDifficulty = data.difficulty;
                this.updateAIDifficultyDisplay(data.difficulty, data.aiConfig);
                this.logAIGame(data.message);
                break;
            case 'game-started':
                this.logAIGame(data.message);
                this.aiGameState.gameStarted = true;
                this.aiGameStartTime = new Date(); // Record actual game start time
                this.startAIGameLoop();
                break;
            case 'game-update':
                // Only update game state if game is actually started
                if (this.aiGameState.gameStarted) {
                    // Check for score changes to play scoring sound
                    const prevPlayerScore = this.aiGameState.playerScore;
                    const prevAiScore = this.aiGameState.aiScore;
                    this.aiGameState = { ...this.aiGameState, ...data.gameState };
                    // Play scoring sound if scores increased
                    if (this.aiGameState.playerScore > prevPlayerScore || this.aiGameState.aiScore > prevAiScore) {
                        this.playScoreSound();
                    }
                    this.updateAIScore();
                }
                break;
            case 'game-paused':
                this.logAIGame(data.message);
                this.stopAIGameLoop();
                break;
            case 'game-resumed':
                this.logAIGame(data.message);
                this.startAIGameLoop();
                break;
            case 'game-over':
                this.logAIGame(data.message);
                this.stopAIGameLoop();
                this.aiGameState.gameStarted = false;
                // Update user stats based on game result with actual duration
                const userWon = data.winner === 'player';
                const gameDuration = this.aiGameStartTime ? new Date().getTime() - this.aiGameStartTime.getTime() : 60000; // Default to 1 minute if no start time
                this.updateUserStats(userWon, 'AI', data.playerScore, data.aiScore, gameDuration);
<<<<<<< HEAD
                // Show power-ups toggle when AI game ends
                this.showPowerupsToggle('ai');
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
                this.showAIGameOverModal(data.winner, data.playerScore, data.aiScore);
                break;
            case 'error':
                this.logAIGame(`Error: ${data.message}`);
                break;
            default:
                console.log('Unknown AI game message type:', data.type);
        }
    }
    aiGameLoop() {
        this.updatePlayerPaddle();
        this.drawAIGame();
        this.aiGameAnimationId = requestAnimationFrame(() => this.aiGameLoop());
    }
    startAIGameLoop() {
        if (!this.aiGameAnimationId) {
            this.aiGameLoop();
        }
    }
    stopAIGameLoop() {
        if (this.aiGameAnimationId) {
            cancelAnimationFrame(this.aiGameAnimationId);
            this.aiGameAnimationId = null;
        }
    }
    updatePlayerPaddle() {
        if (this.aiGameKeys.w && this.aiGameState.playerPaddleY > 0) {
            this.aiGameState.playerPaddleY -= this.aiGameConfig.PADDLE.SPEED;
            if (this.aiGameWs && this.aiGameWs.readyState === WebSocket.OPEN) {
                this.aiGameWs.send(JSON.stringify({ type: 'player-input', action: 'up' }));
            }
        }
        if (this.aiGameKeys.s && this.aiGameState.playerPaddleY < this.aiGameConfig.CANVAS.HEIGHT - this.aiGameConfig.PADDLE.HEIGHT) {
            this.aiGameState.playerPaddleY += this.aiGameConfig.PADDLE.SPEED;
            if (this.aiGameWs && this.aiGameWs.readyState === WebSocket.OPEN) {
                this.aiGameWs.send(JSON.stringify({ type: 'player-input', action: 'down' }));
            }
        }
    }
    initializeAIGameCanvas() {
        console.log('=== INITIALIZING AI GAME CANVAS ===');
        const canvas = document.getElementById('aiGameCanvas');
        const aiGameOverlay = document.getElementById('aiGameOverlay');
        const aiStartButton = document.getElementById('aiStartButton');
        const aiGameMessage = document.getElementById('aiGameMessage');
        console.log('AI game elements found:', {
            canvas: !!canvas,
            aiGameOverlay: !!aiGameOverlay,
            aiStartButton: !!aiStartButton,
            aiGameMessage: !!aiGameMessage
        });
        if (!canvas) {
            console.error('AI game canvas not found');
            return;
        }
        const ctx = canvas.getContext('2d');
        console.log('AI game canvas context found:', !!ctx);
        if (!ctx) {
            console.error('AI game canvas context not found');
            return;
        }
        // Set up canvas dimensions (same as local game)
        canvas.width = this.aiGameConfig.CANVAS.WIDTH;
        canvas.height = this.aiGameConfig.CANVAS.HEIGHT;
        console.log('AI game canvas dimensions set to:', canvas.width, 'x', canvas.height);
        // Reset AI game state
        this.resetAIGameState();
        // Show game overlay with start button
        if (aiGameOverlay) {
            aiGameOverlay.style.display = 'flex';
            console.log('AI game overlay display set to:', aiGameOverlay.style.display);
        }
        if (aiGameMessage) {
            aiGameMessage.textContent = 'Ready to play against AI?';
        }
        if (aiStartButton) {
            aiStartButton.style.display = 'block';
            aiStartButton.textContent = 'Start AI Game';
        }
        // Draw only background and paddles initially (no ball)
        this.drawAIGameBackground();
        console.log('AI game canvas initialized successfully');
    }
    resetAIGameState() {
        // Reset AI game state to initial values
        this.aiGameState = {
            ballX: 400,
            ballY: 300,
            ballSpeedX: 5,
            ballSpeedY: 3,
            ballRadius: 10,
            playerPaddleY: 250,
            aiPaddleY: 250,
            playerScore: 0,
            aiScore: 0,
            currentDifficulty: 'easy',
            gameStarted: false
        };
        // Update score display
        this.updateAIScore();
<<<<<<< HEAD
        // Show power-ups toggle when AI game is reset
        this.showPowerupsToggle('ai');
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        console.log('AI game state reset');
    }
    startAIGameFromOverlay() {
        console.log('=== STARTING AI GAME FROM OVERLAY ===');
        // Hide the start button and overlay
        const aiGameOverlay = document.getElementById('aiGameOverlay');
        const aiStartButton = document.getElementById('aiStartButton');
        if (aiStartButton) {
            aiStartButton.style.display = 'none';
            console.log('AI start button hidden');
        }
        if (aiGameOverlay) {
            aiGameOverlay.style.display = 'none';
            console.log('AI game overlay hidden');
        }
<<<<<<< HEAD
        // Hide power-ups toggle when AI game starts
        this.hidePowerupsToggle('ai');
        // Set powerupsEnabled based on AI toggle state
        const toggleAI = document.getElementById('powerupsToggle');
        const enabled = toggleAI ? toggleAI.checked : true; // Default to true if toggle not found
        console.log('Set powerupsEnabled based on AI toggle:', enabled);
=======
>>>>>>> parent of 5650101 (addition of oauth (fully working))
        // Connect to AI game WebSocket and start the game
        this.connectAIGame();
        // Send start-game message after a short delay to ensure connection is established
        setTimeout(() => {
            if (this.aiGameWs && this.aiGameWs.readyState === WebSocket.OPEN) {
                this.aiGameWs.send(JSON.stringify({ type: 'start-game' }));
                this.logAIGame('Starting game...');
            }
        }, 100);
        console.log('AI game started from overlay');
    }
    setupAIGameEventListeners() {
        console.log('=== SETTING UP AI GAME EVENT LISTENERS ===');
        // AI Start button
        const aiStartButton = document.getElementById('aiStartButton');
        if (aiStartButton) {
            // Remove existing listeners
            const newAiStartButton = aiStartButton.cloneNode(true);
            aiStartButton.parentNode?.replaceChild(newAiStartButton, aiStartButton);
            newAiStartButton.addEventListener('click', () => {
                console.log('AI start button clicked!');
                this.startAIGameFromOverlay();
            });
            console.log('AI start button event listener added');
        }
        else {
            console.error('AI start button not found');
        }
        // AI Customize button
        const aiCustomizeBtn = document.getElementById('aiCustomizeBtn');
        if (aiCustomizeBtn) {
            // Remove existing listeners
            const newAiCustomizeBtn = aiCustomizeBtn.cloneNode(true);
            aiCustomizeBtn.parentNode?.replaceChild(newAiCustomizeBtn, aiCustomizeBtn);
            newAiCustomizeBtn.addEventListener('click', () => {
                console.log('AI customize button clicked!');
                this.showCustomizationModal();
            });
            console.log('AI customize button event listener added');
        }
        else {
            console.error('AI customize button not found');
        }
        // Difficulty buttons
        const easyBtn = document.getElementById('aiEasyBtn');
        if (easyBtn) {
            easyBtn.addEventListener('click', () => this.changeAIDifficulty('EASY'));
        }
        const mediumBtn = document.getElementById('aiMediumBtn');
        if (mediumBtn) {
            mediumBtn.addEventListener('click', () => this.changeAIDifficulty('MEDIUM'));
        }
        const hardBtn = document.getElementById('aiHardBtn');
        if (hardBtn) {
            hardBtn.addEventListener('click', () => this.changeAIDifficulty('HARD'));
        }
        const expertBtn = document.getElementById('aiExpertBtn');
        if (expertBtn) {
            expertBtn.addEventListener('click', () => this.changeAIDifficulty('EXPERT'));
        }
        // Game overlay buttons
        const replayBtn = document.getElementById('replayBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                this.hideAIGameOverlay();
                this.restartAIGame();
            });
        }
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.hideAIGameOverlay();
                this.showSection('homeSection');
            });
        }
        // AI Game Over Modal buttons
        const aiReplayBtn = document.getElementById('aiReplayBtn');
        if (aiReplayBtn) {
            aiReplayBtn.addEventListener('click', () => {
                this.hideAIGameOverModal();
                this.restartAIGame();
            });
        }
        const aiGoHomeBtn = document.getElementById('aiGoHomeBtn');
        if (aiGoHomeBtn) {
            aiGoHomeBtn.addEventListener('click', () => {
                this.hideAIGameOverModal();
                this.showSection('homeSection');
            });
        }
        // Set up keyboard controls
        this.setupAIKeyboardControls();
        console.log('AI game event listeners set up successfully');
    }
    disconnectAIGame() {
        if (this.aiGameWs) {
            this.aiGameWs.close(1000, 'Manual disconnect');
            this.logAIGame('Disconnecting...');
        }
    }
    changeAIDifficulty(difficulty) {
        this.aiGameState.currentDifficulty = difficulty.toLowerCase();
        this.logAIGame(`Changing difficulty to: ${difficulty}`);
        // Update difficulty button states immediately for visual feedback
        this.updateAIDifficultyButtons(difficulty);
        // Ensure WebSocket connection is established
        if (!this.aiGameWs || this.aiGameWs.readyState !== WebSocket.OPEN) {
            this.logAIGame('WebSocket not connected, establishing connection...');
            this.connectAIGame();
            // Wait for connection to be established, then send difficulty change
            setTimeout(() => {
                if (this.aiGameWs && this.aiGameWs.readyState === WebSocket.OPEN) {
                    this.aiGameWs.send(JSON.stringify({
                        type: 'change-difficulty',
                        difficulty: difficulty
                    }));
                    this.logAIGame(`Sent difficulty change to backend: ${difficulty}`);
                }
                else {
                    this.logAIGame('Failed to establish WebSocket connection for difficulty change');
                }
            }, 500);
        }
        else {
            // WebSocket is already connected, send difficulty change immediately
            this.aiGameWs.send(JSON.stringify({
                type: 'change-difficulty',
                difficulty: difficulty
            }));
            this.logAIGame(`Sent difficulty change to backend: ${difficulty}`);
        }
    }
    updateAIDifficultyButtons(activeDifficulty) {
        const difficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
        difficulties.forEach(diff => {
            const btn = document.getElementById(`ai${diff}Btn`);
            if (btn) {
                // Remove all active states
                btn.classList.remove('ring-4', 'ring-white', 'ring-opacity-50', 'border-4', 'border-white', 'scale-110');
                // Add active state to selected difficulty
                if (diff === activeDifficulty) {
                    btn.classList.add('ring-4', 'ring-white', 'ring-opacity-50', 'border-4', 'border-white', 'scale-110');
                }
            }
        });
        // Update difficulty text display
        const difficultyText = document.getElementById('currentDifficultyText');
        if (difficultyText) {
            difficultyText.textContent = activeDifficulty;
        }
    }
    hideAIGameOverlay() {
        const gameOverlay = document.getElementById('gameOverlay');
        if (gameOverlay) {
            gameOverlay.classList.add('hidden');
        }
    }
    hideAIGameOverModal() {
        const modal = document.getElementById('aiGameOverModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    drawAIGame() {
        console.log('=== DRAWING AI GAME ===');
        const canvas = document.getElementById('aiGameCanvas');
        console.log('AI game canvas found for drawing:', !!canvas);
        if (!canvas) {
            console.error('AI game canvas not found for drawing');
            return;
        }
        const ctx = canvas.getContext('2d');
        console.log('AI game canvas context found for drawing:', !!ctx);
        if (!ctx) {
            console.error('AI game canvas context not found for drawing');
            return;
        }
        console.log('AI game canvas dimensions:', canvas.width, 'x', canvas.height);
        console.log('AI game config dimensions:', this.aiGameConfig.CANVAS.WIDTH, 'x', this.aiGameConfig.CANVAS.HEIGHT);
        // Clear canvas with custom table color (same as local game)
        ctx.fillStyle = this.customizationSettings.tableColor;
        ctx.fillRect(0, 0, this.aiGameConfig.CANVAS.WIDTH, this.aiGameConfig.CANVAS.HEIGHT);
        console.log('Canvas cleared with color:', this.customizationSettings.tableColor);
        // Draw center line (same style as local game)
        ctx.strokeStyle = '#533483';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(this.aiGameConfig.CANVAS.WIDTH / 2, 0);
        ctx.lineTo(this.aiGameConfig.CANVAS.WIDTH / 2, this.aiGameConfig.CANVAS.HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
        console.log('Center line drawn');
        // Draw player paddle (left) with custom color (same as local game)
        ctx.fillStyle = this.customizationSettings.myPaddleColor;
        ctx.fillRect(50, this.aiGameState.playerPaddleY, this.aiGameConfig.PADDLE.WIDTH, this.aiGameConfig.PADDLE.HEIGHT);
        console.log('Player paddle drawn at:', 50, this.aiGameState.playerPaddleY, 'color:', this.customizationSettings.myPaddleColor);
        // Draw AI paddle (right) with custom color (same as local game)
        ctx.fillStyle = this.customizationSettings.opponentPaddleColor;
        ctx.fillRect(735, this.aiGameState.aiPaddleY, this.aiGameConfig.PADDLE.WIDTH, this.aiGameConfig.PADDLE.HEIGHT);
        console.log('AI paddle drawn at:', 735, this.aiGameState.aiPaddleY, 'color:', this.customizationSettings.opponentPaddleColor);
        // Draw ball only when game is started (same color as local game)
        console.log('AI Game drawAIGame - gameStarted:', this.aiGameState.gameStarted);
        if (this.aiGameState.gameStarted) {
            ctx.fillStyle = '#f5f5f5';
            ctx.beginPath();
            ctx.arc(this.aiGameState.ballX, this.aiGameState.ballY, this.aiGameState.ballRadius, 0, Math.PI * 2);
            ctx.fill();
            console.log('Ball drawn at:', this.aiGameState.ballX, this.aiGameState.ballY, 'radius:', this.aiGameState.ballRadius);
        }
        else {
            console.log('Ball not drawn - game not started, gameStarted =', this.aiGameState.gameStarted);
        }
        console.log('=== AI GAME DRAWING COMPLETE ===');
    }
    drawAIGameBackground() {
        console.log('=== DRAWING AI GAME BACKGROUND ===');
        const canvas = document.getElementById('aiGameCanvas');
        if (!canvas) {
            console.error('AI game canvas not found');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('AI game canvas context not found');
            return;
        }
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
        // Draw player paddle (left) with custom color
        ctx.fillStyle = this.customizationSettings.myPaddleColor;
        ctx.fillRect(50, this.aiGameState.playerPaddleY, this.aiGameConfig.PADDLE.WIDTH, this.aiGameConfig.PADDLE.HEIGHT);
        // Draw AI paddle (right) with custom color
        ctx.fillStyle = this.customizationSettings.opponentPaddleColor;
        ctx.fillRect(735, this.aiGameState.aiPaddleY, this.aiGameConfig.PADDLE.WIDTH, this.aiGameConfig.PADDLE.HEIGHT);
        console.log('=== AI GAME BACKGROUND DRAWING COMPLETE ===');
    }
    updateAIScore() {
        // Update individual score elements
        const playerScoreElement = document.getElementById('aiPlayerScore');
        const aiScoreElement = document.getElementById('aiOpponentScore');
        if (playerScoreElement) {
            playerScoreElement.textContent = this.aiGameState.playerScore.toString();
        }
        if (aiScoreElement) {
            aiScoreElement.textContent = this.aiGameState.aiScore.toString();
        }
        // Also update the combined score display if it exists
        const scoreDisplay = document.getElementById('aiScoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Player: ${this.aiGameState.playerScore} - AI: ${this.aiGameState.aiScore}`;
        }
    }
    updateAIDifficultyDisplay(difficulty, config) {
        const difficultyDisplay = document.getElementById('aiDifficultyDisplay');
        if (difficultyDisplay) {
            difficultyDisplay.textContent = `Difficulty: ${config.name} (${config.speed}x)`;
        }
        // Also update the button visual states
        this.updateAIDifficultyButtons(difficulty);
    }
    logAIGame(message) {
        const logElement = document.getElementById('aiGameLog');
        if (logElement) {
            const timestamp = new Date().toLocaleTimeString();
            logElement.innerHTML += `<div>[${timestamp}] ${message}</div>`;
            logElement.scrollTop = logElement.scrollHeight;
        }
    }
    showAIGameOverModal(winner, playerScore, aiScore) {
        const modal = document.getElementById('aiGameOverModal');
        if (modal) {
            this.playEndGameSound();
            const title = document.getElementById('aiGameOverTitle');
            const message = document.getElementById('aiGameOverMessage');
            const playerScoreElement = document.getElementById('aiGameOverPlayerScore');
            const aiScoreElement = document.getElementById('aiGameOverAIScore');
            if (title)
                title.textContent = winner === 'player' ? 'You Won!' : 'AI Won!';
            if (message)
                message.textContent = `Final Score: ${playerScore} - ${aiScore}`;
            if (playerScoreElement)
                playerScoreElement.textContent = playerScore.toString();
            if (aiScoreElement)
                aiScoreElement.textContent = aiScore.toString();
            // Set up button event listeners
            this.setupAIGameOverButtons();
            modal.classList.remove('hidden');
        }
    }
    setupAIGameOverButtons() {
        // Play Again button
        const playAgainBtn = document.getElementById('aiPlayAgainBtn');
        if (playAgainBtn) {
            // Remove existing listeners
            const newPlayAgainBtn = playAgainBtn.cloneNode(true);
            playAgainBtn.parentNode?.replaceChild(newPlayAgainBtn, playAgainBtn);
            newPlayAgainBtn.onclick = () => {
                this.hideAIGameOverModal();
                this.restartAIGame();
            };
        }
        // Go Home button
        const goHomeBtn = document.getElementById('aiGoHomeBtn');
        if (goHomeBtn) {
            // Remove existing listeners
            const newGoHomeBtn = goHomeBtn.cloneNode(true);
            goHomeBtn.parentNode?.replaceChild(newGoHomeBtn, goHomeBtn);
            newGoHomeBtn.onclick = () => {
                this.hideAIGameOverModal();
                this.goHome();
            };
        }
    }
    /**
     * Initialize colorblind mode from localStorage
     */
    initializeColorblindMode() {
        const savedMode = localStorage.getItem('colorblindMode');
        if (savedMode === 'true') {
            this.colorblindMode = true;
            this.applyColorblindMode();
        }
    }
    /**
     * Toggle contrast mode
     */
    toggleColorblindMode() {
        console.log('toggleContrastMode called, current mode:', this.colorblindMode);
        this.colorblindMode = !this.colorblindMode;
        console.log('New contrast mode:', this.colorblindMode);
        this.applyColorblindMode();
        // Save preference to localStorage
        localStorage.setItem('colorblindMode', this.colorblindMode.toString());
        // Update button text
        const colorblindToggle = document.getElementById('colorblindToggle');
        if (colorblindToggle) {
            colorblindToggle.textContent = this.colorblindMode ? '☀️ Normal' : '☀️ Contrast';
            colorblindToggle.title = this.colorblindMode ? 'Switch to Normal Mode' : 'Switch to Contrast Mode';
            console.log('Button text updated to:', colorblindToggle.textContent);
        }
    }
    /**
     * Apply or remove colorblind mode styles
     */
    applyColorblindMode() {
        const body = document.body;
        if (this.colorblindMode) {
            body.classList.add('colorblind-mode');
        }
        else {
            body.classList.remove('colorblind-mode');
        }
    }
    /**
     * Setup colorblind toggle with retry logic
     */
    setupColorblindToggle() {
        const trySetup = () => {
            const colorblindToggle = document.getElementById('colorblindToggle');
            if (colorblindToggle) {
                console.log('Colorblind toggle button found:', colorblindToggle);
                colorblindToggle.addEventListener('click', (e) => {
                    console.log('Colorblind toggle clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleColorblindMode();
                });
                console.log('Colorblind toggle event listener attached');
            }
            else {
                console.log('Colorblind toggle button not found, retrying in 100ms...');
                setTimeout(trySetup, 100);
            }
        };
        trySetup();
    }
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SimpleAuth...');
    const simpleAuth = new SimpleAuth();
    window.simpleAuth = simpleAuth;
    console.log('SimpleAuth initialized and made global');
});
// Global function for game selection (for onclick attributes)
window.startGame = function (gameType) {
    console.log('Global startGame called with:', gameType);
    // This will be handled by the SimpleAuth instance
};
// Global function for colorblind toggle
window.toggleColorblind = function () {
    console.log('Global toggleColorblind called');
    if (window.simpleAuth && window.simpleAuth.toggleColorblindMode) {
        window.simpleAuth.toggleColorblindMode();
    }
    else {
        console.error('SimpleAuth instance not found or toggleColorblindMode method not available');
    }
};
