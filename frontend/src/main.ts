// Simple Authentication System
class SimpleAuth {
    private currentUser: any = null;
    private authToken: string | null = null;

    constructor() {
        console.log('SimpleAuth constructor called');
        this.init();
    }

    private init(): void {
        console.log('=== SimpleAuth initializing... ===');
        console.log('Init method called at:', new Date().toISOString());
        console.log('Document ready state:', document.readyState);
        console.log('Current cookies at init:', document.cookie);
        
        console.log('About to call checkAuthStatus...');
        this.checkAuthStatus();
        console.log('checkAuthStatus completed');
        
        console.log('About to call setupEventListeners...');
        this.setupEventListeners();
        console.log('setupEventListeners completed');
        
        console.log('About to call setupMainAppNavigation...');
        this.setupMainAppNavigation();
        console.log('setupMainAppNavigation completed');
        
        console.log('About to call setupGameOptions...');
        this.setupGameOptions();
        console.log('setupGameOptions completed');
        
        console.log('=== SimpleAuth initialization complete ===');
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
                this.updatePasswordRequirements((e.target as HTMLInputElement).value);
            });
        }

        // Avatar upload
        const avatarUpload = document.getElementById('avatarUpload') as HTMLInputElement;
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }

        // Test authentication button (for debugging)
        const testAuthBtn = document.getElementById('testAuthBtn');
        if (testAuthBtn) {
            testAuthBtn.addEventListener('click', () => {
                this.testAuthentication();
            });
        }

        // Friends functionality
        this.setupFriendsEventListeners();
        
        // Tournament functionality
        this.setupTournamentEventListeners();
    }

    private setupFriendsEventListeners(): void {
        // Search users input
        const searchUsersInput = document.getElementById('searchUsersInput') as HTMLInputElement;
        if (searchUsersInput) {
            searchUsersInput.addEventListener('input', (e) => {
                this.handleUserSearch((e.target as HTMLInputElement).value);
            });
        }

        // Load friends data when friends section is shown
        const navFriends = document.getElementById('navFriends');
        if (navFriends) {
            navFriends.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('friendsSection');
                this.loadFriendsData();
            });
        }
    }

    private setupTournamentEventListeners(): void {
        // Player count selection
        const tournament4Players = document.getElementById('tournament4Players');
        const tournament8Players = document.getElementById('tournament8Players');
        
        if (tournament4Players) {
            tournament4Players.addEventListener('click', () => {
                this.setupTournament(4);
            });
        }
        
        if (tournament8Players) {
            tournament8Players.addEventListener('click', () => {
                this.setupTournament(8);
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
                this.startCurrentMatch();
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

    private async testAuthentication(): Promise<void> {
        try {
            console.log('Testing authentication...');
            const response = await fetch('https://localhost/api/profile/test-auth', {
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
            this.showStatus('Please enter a new username', 'error');
            return;
        }

        if (!this.currentUser) {
            this.showStatus('Please log in to change username', 'error');
            return;
        }

        // Debug: Check if we have a token in localStorage
        console.log('Current user:', this.currentUser);
        console.log('localStorage user:', localStorage.getItem('user'));
        console.log('Current cookies:', document.cookie);

        // Check if backend is running first
        try {
            console.log('Testing backend connection...');
            const healthCheck = await fetch('https://localhost/api/profile/me', {
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
        } catch (error) {
            console.error('Health check failed:', error);
            this.showStatus('Cannot connect to server. Please make sure the backend is running.', 'error');
            return;
        }

        try {
            console.log('Sending username update request:', { newUsername });
            console.log('Request URL:', 'https://localhost/api/profile/username');
            console.log('Request method:', 'PATCH');
            console.log('Request headers:', {
                'Content-Type': 'application/json',
            });
            console.log('Request body:', JSON.stringify({ newUsername }));
            console.log('Credentials:', 'include');
            
            const response = await fetch('https://localhost/api/profile/username', {
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
            } else if (response.status === 401) {
                // Unauthorized - user needs to login again
                const errorData = await response.json();
                console.error('Username update 401 error:', errorData);
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Username update error:', errorData);
                this.showStatus(errorData.error || 'Failed to update username', 'error');
            }
        } catch (error) {
            console.error('Error updating username:', error);
            this.showStatus('Network error updating username. Please check if the backend server is running.', 'error');
        }
    }

    private async handlePasswordChange(): Promise<void> {
        const currentPasswordInput = document.getElementById('currentPassword') as HTMLInputElement;
        const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
        
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

        // Debug: Check authentication state
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
            console.log('Request URL:', 'https://localhost/api/profile/password');
            console.log('Request method:', 'PATCH');
            console.log('Request headers:', {
                'Content-Type': 'application/json',
            });
            console.log('Request body:', JSON.stringify({ currentPassword, newPassword: '***' }));
            console.log('Credentials:', 'include');
            
            const response = await fetch('https://localhost/api/profile/password', {
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
            } else if (response.status === 401) {
                const errorData = await response.json();
                console.error('Password update 401 error:', errorData);
                
                // Check if it's a password error or session error
                if (errorData.error && errorData.error.includes('password Incorrect')) {
                    this.showStatus('Current password is incorrect', 'error');
                } else {
                    this.showStatus('Session expired. Please login again.', 'error');
                    localStorage.removeItem('user');
                    this.currentUser = null;
                    setTimeout(() => {
                        this.showPage('loginPage');
                    }, 2000);
                }
            } else if (response.status === 400) {
                const errorData = await response.json();
                console.error('Password update 400 error:', errorData);
                this.showStatus(errorData.message || 'Invalid request', 'error');
            } else {
                const errorData = await response.json();
                console.error('Password update error:', errorData);
                this.showStatus(errorData.message || errorData.error || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Password update error:', error);
            this.showStatus('Network error updating password. Please check if the backend server is running.', 'error');
        }
    }

    private async handleAvatarUpload(event: Event): Promise<void> {
        const fileInput = event.target as HTMLInputElement;
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

            const response = await fetch('https://localhost/api/profile/avatar', {
                method: 'PATCH',
                body: formData,
                credentials: 'include'
            });

            console.log('Avatar upload response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Avatar upload response:', data);
                
                // Update the avatar display
                const profileAvatar = document.getElementById('profileAvatar') as HTMLImageElement;
                if (profileAvatar) {
                    // Add timestamp to prevent caching
                    profileAvatar.src = `https://localhost${data.avatarUrl}?t=${Date.now()}`;
                }
                
                // Update current user data
                if (this.currentUser) {
                    this.currentUser.avatarUrl = data.avatarUrl;
                    localStorage.setItem('user', JSON.stringify(this.currentUser));
                }
                
                this.showStatus('Avatar uploaded successfully!', 'success');
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else if (response.status === 413) {
                this.showStatus('File too large. Please select a smaller image.', 'error');
                fileInput.value = ''; // Clear the file input
            } else if (response.status === 415) {
                this.showStatus('Unsupported file type. Please select JPEG, PNG, or WebP.', 'error');
                fileInput.value = ''; // Clear the file input
            } else {
                const errorData = await response.json();
                console.error('Avatar upload error:', errorData);
                this.showStatus(errorData.error || 'Failed to upload avatar', 'error');
                fileInput.value = ''; // Clear the file input
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showStatus('Network error uploading avatar. Please check if the backend server is running.', 'error');
            fileInput.value = ''; // Clear the file input
            fileInput.value = ''; // Clear the file input
        }
    }

    private async handleUserSearch(searchTerm: string): Promise<void> {
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
            const response = await fetch(`https://localhost/api/friends/searchUser?q=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                credentials: 'include'
            });

            console.log('User search response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('User search response:', data);
                this.displayUsers(data.users);
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('User search error:', errorData);
                this.showStatus(errorData.error || 'Failed to search users', 'error');
            }
        } catch (error) {
            console.error('User search error:', error);
            this.showStatus('Network error searching users. Please check if the backend server is running.', 'error');
        }
    }

    private async loadFriendsData(): Promise<void> {
        if (!this.currentUser) {
            this.showStatus('Please log in to load friends data', 'error');
            return;
        }

        try {
            console.log('Loading friends data...');
            const response = await fetch('https://localhost/api/friends', {
                method: 'GET',
                credentials: 'include'
            });

            console.log('Friends data response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Friends data response:', data);
                this.displayFriends(data.friends);
                this.displayFriendRequests(data.pendingRequests);
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Friends data error:', errorData);
                this.showStatus(errorData.error || 'Failed to load friends data', 'error');
            }
        } catch (error) {
            console.error('Friends data error:', error);
            this.showStatus('Network error loading friends data. Please check if the backend server is running.', 'error');
        }
    }

    private displayUsers(users: any[]): void {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

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
                            <img src="${user.avatarUrl ? `https://localhost${user.avatarUrl}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`}" 
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

    private displayFriends(friends: any[]): void {
        const friendsList = document.getElementById('friendsList');
        if (!friendsList) return;

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
                            <img src="${friend.avatarUrl ? `https://localhost${friend.avatarUrl}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}`}" 
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

    private displayFriendRequests(requests: any[]): void {
        const friendRequests = document.getElementById('friendRequests');
        if (!friendRequests) return;

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
                        <img src="${request.avatarUrl ? `https://localhost${request.avatarUrl}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(request.username)}`}" 
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

    private clearUsersList(): void {
        const usersList = document.getElementById('usersList');
        if (usersList) {
            usersList.innerHTML = '';
        }
    }

    private isUserOnline(lastSeen: string): boolean {
        if (!lastSeen) return false;
        const lastSeenTime = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = (now.getTime() - lastSeenTime.getTime()) / (1000 * 60);
        return diffInMinutes < 5; // Consider online if last seen within 5 minutes
    }

    // Global methods for button clicks
    public async sendFriendRequest(userId: number): Promise<void> {
        if (!this.currentUser) {
            this.showStatus('Please log in to send friend requests', 'error');
            return;
        }

        try {
            console.log('Sending friend request to user:', userId);
            const response = await fetch('https://localhost/api/friends/sendRequest', {
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
                const button = document.getElementById(`sendRequestBtn_${userId}`) as HTMLButtonElement;
                if (button) {
                    button.textContent = '✅ Request Sent';
                    button.className = 'bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors cursor-not-allowed';
                    button.disabled = true;
                }
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Send friend request error:', errorData);
                this.showStatus(errorData.error || 'Failed to send friend request', 'error');
            }
        } catch (error) {
            console.error('Send friend request error:', error);
            this.showStatus('Network error sending friend request. Please check if the backend server is running.', 'error');
        }
    }

    public async acceptFriendRequest(userId: number): Promise<void> {
        if (!this.currentUser) {
            this.showStatus('Please log in to accept friend requests', 'error');
            return;
        }

        try {
            console.log('Accepting friend request from user:', userId);
            const response = await fetch('https://localhost/api/friends/acceptRequest', {
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
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Accept friend request error:', errorData);
                this.showStatus(errorData.error || 'Failed to accept friend request', 'error');
            }
        } catch (error) {
            console.error('Accept friend request error:', error);
            this.showStatus('Network error accepting friend request. Please check if the backend server is running.', 'error');
        }
    }

    public async declineFriendRequest(userId: number): Promise<void> {
        if (!this.currentUser) {
            this.showStatus('Please log in to decline friend requests', 'error');
            return;
        }

        try {
            console.log('Declining friend request from user:', userId);
            const response = await fetch('https://localhost/api/friends/declineRequest', {
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
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Decline friend request error:', errorData);
                this.showStatus(errorData.error || 'Failed to decline friend request', 'error');
            }
        } catch (error) {
            console.error('Decline friend request error:', error);
            this.showStatus('Network error declining friend request. Please check if the backend server is running.', 'error');
        }
    }

    public async removeFriend(userId: number): Promise<void> {
        if (!this.currentUser) {
            this.showStatus('Please log in to remove friends', 'error');
            return;
        }

        try {
            console.log('Removing friend:', userId);
            const response = await fetch('https://localhost/api/friends/removeFriend', {
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
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Remove friend error:', errorData);
                this.showStatus(errorData.error || 'Failed to remove friend', 'error');
            }
        } catch (error) {
            console.error('Remove friend error:', error);
            this.showStatus('Network error removing friend. Please check if the backend server is running.', 'error');
        }
    }

    public async blockFriend(userId: number): Promise<void> {
        if (!this.currentUser) {
            this.showStatus('Please log in to block friends', 'error');
            return;
        }

        try {
            console.log('Blocking friend:', userId);
            const response = await fetch('https://localhost/api/friends/blockFriend', {
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
            } else if (response.status === 401) {
                this.showStatus('Session expired. Please login again.', 'error');
                localStorage.removeItem('user');
                this.currentUser = null;
                setTimeout(() => {
                    this.showPage('loginPage');
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Block friend error:', errorData);
                this.showStatus(errorData.error || 'Failed to block friend', 'error');
            }
        } catch (error) {
            console.error('Block friend error:', error);
            this.showStatus('Network error blocking friend. Please check if the backend server is running.', 'error');
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
            console.log('Sending registration request to:', 'https://localhost/api/auth/registerUser');
            const response = await fetch('https://localhost/api/auth/registerUser', {
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
            console.log('Sending login request to:', 'https://localhost/api/auth/login');
            const response = await fetch('https://localhost/api/auth/login', {
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
                console.log('Login response data:', data);
                console.log('Cookies after login:', document.cookie);
                
                // The backend sets the token as a cookie, so we don't need to store it manually
                // But we can store user info from the response if available
                if (data.user) {
                    this.currentUser = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                    this.updateProfileDisplay(); // Update profile display with user data
                }
                
                this.showStatus('Login successful! Redirecting to home...', 'success');
                
                // Clear search input when logging in
                const searchInput = document.getElementById('searchUsersInput') as HTMLInputElement;
                if (searchInput) {
                    searchInput.value = '';
                    this.clearUsersList();
                }
                
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
        console.log('=== CHECKING AUTH STATUS ===');
        console.log('Method checkAuthStatus called at:', new Date().toISOString());
        
        const user = localStorage.getItem('user');
        console.log('localStorage user:', user);
        console.log('Current cookies:', document.cookie);

        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                console.log('Parsed current user:', this.currentUser);
                
                // Check if we have a valid authentication cookie
                const hasCookie = document.cookie.includes('token=');
                console.log('Has authentication cookie:', hasCookie);
                
                if (!hasCookie) {
                    console.log('⚠️ No authentication cookie found, but user data exists');
                    console.log('⚠️ Proceeding with cached user data...');
                    
                    // Show the main app with cached data even without cookie
                    this.showPage('mainApp');
                    this.updateHomeDashboard();
                    this.updateProfileDisplay();
                    
                    // Clear search input when restoring from localStorage
                    const searchInput = document.getElementById('searchUsersInput') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.value = '';
                        this.clearUsersList();
                    }
                    
                    // Check if we have a saved section preference
                    const savedSection = localStorage.getItem('lastActiveSection');
                    const activeSection = document.querySelector('.section.active');
                    
                    if (savedSection && !activeSection) {
                        console.log('🔄 Restoring saved section:', savedSection);
                        this.showSection(savedSection);
                    } else if (!activeSection) {
                        console.log('🏠 No saved section, showing home');
                        this.showSection('homeSection');
                    } else {
                        console.log('✅ Keeping current active section');
                    }
                    
                    return;
                }
                
                console.log('✅ Authentication cookie found, showing main app');
                // Show the main app with cached data
                this.showPage('mainApp');
                this.updateHomeDashboard();
                this.updateProfileDisplay();
                
                // Clear search input when restoring from localStorage
                const searchInput = document.getElementById('searchUsersInput') as HTMLInputElement;
                if (searchInput) {
                    searchInput.value = '';
                    this.clearUsersList();
                }
                
                // Check if we have a saved section preference
                const savedSection = localStorage.getItem('lastActiveSection');
                const activeSection = document.querySelector('.section.active');
                
                if (savedSection && !activeSection) {
                    console.log('🔄 Restoring saved section:', savedSection);
                    this.showSection(savedSection);
                } else if (!activeSection) {
                    console.log('🏠 No saved section, showing home');
                    this.showSection('homeSection');
                } else {
                    console.log('✅ Keeping current active section');
                }
                
                // Don't load fresh data immediately to avoid authentication issues
                // The user can manually refresh if needed
            } catch (error) {
                console.error('❌ Error parsing user from localStorage:', error);
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showPage('registrationPage');
            }
        } else {
            console.log('❌ No user in localStorage, showing registration page');
            this.showPage('registrationPage');
        }
        console.log('=== AUTH STATUS CHECK COMPLETE ===');
    }

    private async tryRefreshToken(): Promise<void> {
        console.log('Attempting to refresh token...');
        try {
            const response = await fetch('https://localhost/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                console.log('✅ Token refresh successful');
                // Show the main app with cached data
                this.showPage('mainApp');
                this.updateHomeDashboard();
                this.updateProfileDisplay();
                
                // Check if we have a saved section preference
                const savedSection = localStorage.getItem('lastActiveSection');
                const activeSection = document.querySelector('.section.active');
                
                if (savedSection && !activeSection) {
                    console.log('🔄 Restoring saved section after token refresh:', savedSection);
                    this.showSection(savedSection);
                } else if (!activeSection) {
                    console.log('🏠 No saved section, showing home');
                    this.showSection('homeSection');
                } else {
                    console.log('✅ Keeping current active section');
                }
            } else {
                console.log('❌ Token refresh failed, clearing localStorage');
                localStorage.removeItem('user');
                this.currentUser = null;
                this.showStatus('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    this.showPage('registrationPage');
                }, 2000);
            }
        } catch (error) {
            console.error('❌ Token refresh error:', error);
            console.log('⚠️ Showing main app anyway with cached data (graceful degradation)');
            // Show the main app with cached data as a fallback
            this.showPage('mainApp');
            this.updateHomeDashboard();
            this.updateProfileDisplay();
            
            // Check if we have a saved section preference
            const savedSection = localStorage.getItem('lastActiveSection');
            const activeSection = document.querySelector('.section.active');
            
            if (savedSection && !activeSection) {
                console.log('🔄 Restoring saved section after error:', savedSection);
                this.showSection(savedSection);
            } else if (!activeSection) {
                console.log('🏠 No saved section, showing home');
                this.showSection('homeSection');
            } else {
                console.log('✅ Keeping current active section');
            }
        }
    }

    private async handleLogout(): Promise<void> {
        try {
            // Call the logout endpoint to clear the server-side cookie
            await fetch('https://localhost/api/auth/logout', {
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
            
            // Save the current section to localStorage for persistence
            localStorage.setItem('lastActiveSection', sectionId);
            console.log(`Saved section to localStorage: ${sectionId}`);
            
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
        const navTournament = document.getElementById('navTournament');
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
            const response = await fetch('https://localhost/api/profile/me', {
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
        } else if (gameType === 'tournament') {
            // Redirect to tournament section
            this.showSection('localTournamentSection');
            console.log('Tournament section shown');
        } else if (gameType === 'online') {
            // Redirect to online game section for direct remote connection
            this.showSection('onlineGameSection');
            console.log('Remote game section shown, initializing direct connection...');
            setTimeout(() => {
                this.initializeRemoteGame();
            }, 100); // Small delay to ensure DOM is ready
        } else if (gameType === 'remote') {
            // Redirect to online game section for remote game
            this.showSection('onlineGameSection');
            console.log('Remote game section shown, initializing remote game...');
            setTimeout(() => {
                this.initializeRemoteGame();
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

    // Online game state
    private onlineGameState: {
        matchmakingSocket: WebSocket | null;
        gameSocket: WebSocket | null;
        matchId: number | null;
        playerNumber: number | null;
        isConnected: boolean;
        isInMatch: boolean;
        gameFinished: boolean; // Track if game was completed
        gameState: {
            ballX: number;
            ballY: number;
            leftPaddleY: number;
            rightPaddleY: number;
            player1Score: number;
            player2Score: number;
            speedX: number;
            speedY: number;
        };
    } = {
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
        }
    };

    // Customization settings
    private customizationSettings = {
        tableColor: '#0f0f23',
        paddleColor: '#e94560',
        myPaddleColor: '#7209b7', // Player's own paddle color
        opponentPaddleColor: '#e94560' // Opponent's paddle color
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

        // Hide the start button when game starts
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.style.display = 'none';
        }

        // Keep customize button visible during gameplay
        const customizeBtn = document.getElementById('customizeBtn');
        if (customizeBtn) {
            customizeBtn.style.display = 'block';
        }

        // Hide game overlay
        const gameOverlay = document.getElementById('gameOverlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
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
                    } else if (type === 'myPaddle') {
                        this.customizationSettings.myPaddleColor = color;
                    } else if (type === 'opponentPaddle') {
                        this.customizationSettings.opponentPaddleColor = color;
                    }
                    
                    // Update the game display
                    this.drawGame();
                    
                    // Also update remote game if active
                    if (this.onlineGameState.isConnected) {
                        this.drawRemoteGame();
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
            // Check if this is a tournament game
            if (this.currentTournamentMatch) {
                // Use tournament player names
                const winnerName = winner === 1 ? this.currentTournamentMatch.player1 : this.currentTournamentMatch.player2;
                gameMessage.textContent = `🏆 ${winnerName} wins! 🏆`;
                gameMessage.className = 'text-4xl font-bold mb-8 text-white drop-shadow-lg text-center w-full';
            } else {
                // Use regular 1v1 logic
                if (winner === 1) {
                    gameMessage.textContent = `🏆 ${this.currentUser.username} wins! 🏆`;
                    gameMessage.className = 'text-4xl font-bold mb-8 text-white drop-shadow-lg text-center w-full';
                    console.log('User won, showing result popup...');
                } else {
                    gameMessage.textContent = '🏆 Local Player wins! 🏆';
                    gameMessage.className = 'text-4xl font-bold mb-8 text-white drop-shadow-lg text-center w-full';
                    console.log('User lost, showing result popup...');
                }
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
            console.log('Loading user profile, current cookies:', document.cookie);
            const response = await fetch('https://localhost/api/profile/me', {
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
                // Unauthorized - try to refresh token first
                console.log('User not authenticated, attempting token refresh...');
                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);
                
                // Try to refresh the token instead of immediately logging out
                await this.tryRefreshToken();
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
        const profileAvatar = document.getElementById('profileAvatar') as HTMLImageElement;

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
            if (this.currentUser.avatarUrl) {
                // Use the user's custom avatar
                profileAvatar.src = `https://localhost${this.currentUser.avatarUrl}?t=${Date.now()}`;
                console.log('Updated avatar with custom image:', this.currentUser.avatarUrl);
            } else {
                // Use default avatar with username
                profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.username || 'Player')}`;
                console.log('Updated avatar with default image for:', this.currentUser.username);
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

    private async refreshUserData(): Promise<void> {
        try {
            console.log('🔄 Refreshing user data from server...');
            const response = await fetch('https://localhost/api/auth/profile', {
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
                
                console.log('✅ User data refreshed successfully');
            } else {
                console.log('❌ Failed to refresh user data:', response.status);
            }
        } catch (error) {
            console.log('❌ Error refreshing user data:', error);
        }
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
            const response = await fetch('https://localhost/api/auth/refresh', {
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
        // Don't update stats for tournament games
        if (this.currentTournamentMatch) {
            console.log('Tournament game - skipping stats update');
            return;
        }

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
            const response = await fetch('https://localhost/api/profile/update-stats', {
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

    // Tournament functionality
    private tournamentState: {
        players: string[];
        currentRound: number;
        currentMatch: number;
        matches: Array<{player1: string, player2: string, winner?: string}>;
        bracket: Array<Array<{player1: string, player2: string, winner?: string}>>;
    } = {
        players: [],
        currentRound: 0,
        currentMatch: 0,
        matches: [],
        bracket: []
    };

    private currentTournamentMatch: {player1: string, player2: string, winner?: string} | null = null;
    private originalEndGame: ((winner: number) => Promise<void>) | null = null;

    private setupTournament(playerCount: number): void {
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
        const tournament8Players = document.getElementById('tournament8Players');
        if (tournament4Players) tournament4Players.style.display = 'none';
        if (tournament8Players) tournament8Players.style.display = 'none';

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
            for (let i = 1; i < playerCount; i++) {
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

        this.showStatus(`Tournament setup for ${playerCount} players`, 'info');
    }

    private startTournament(): void {
        // Collect player names
        const playerCount = this.tournamentState.players.length === 0 ? 4 : this.tournamentState.players.length;
        const players: string[] = [];
        
        for (let i = 0; i < playerCount; i++) {
            const input = document.getElementById(`player${i}`) as HTMLInputElement;
            if (input && input.value.trim()) {
                players.push(input.value.trim());
            }
        }

        if (players.length !== playerCount) {
            this.showStatus(`Please enter all ${playerCount} player names`, 'error');
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
        
        if (playerNamesForm) playerNamesForm.classList.add('hidden');
        if (tournamentBracket) tournamentBracket.classList.remove('hidden');

        this.showStatus('Tournament started!', 'success');
        this.showNextMatch();
    }

    private generateBracket(): void {
        const players = [...this.tournamentState.players];
        const bracket: Array<Array<{player1: string, player2: string, winner?: string}>> = [];
        
        // Shuffle players for random seeding
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }

        // Generate first round matches
        const firstRound: Array<{player1: string, player2: string, winner?: string}> = [];
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

        this.displayBracket();
    }

    private displayBracket(): void {
        const bracketContainer = document.getElementById('bracketContainer');
        if (!bracketContainer) return;

        bracketContainer.innerHTML = '';
        
        this.tournamentState.bracket.forEach((round, roundIndex) => {
            const roundDiv = document.createElement('div');
            // Make boxes bigger for 2-round tournaments
            const isTwoRounds = this.tournamentState.bracket.length === 2;
            roundDiv.className = isTwoRounds ? 'mr-12' : 'mr-8';
            roundDiv.innerHTML = `
                <h4 class="text-2xl font-bold text-white mb-4 text-center">Round ${roundIndex + 1}</h4>
            `;
            
            round.forEach((match, matchIndex) => {
                const matchDiv = document.createElement('div');
                // Bigger boxes for 2-round tournaments
                const boxClass = isTwoRounds ? 'bg-white/20 rounded-lg p-6 mb-4 border border-white/30' : 'bg-white/20 rounded-lg p-3 mb-2 border border-white/30';
                matchDiv.className = boxClass;
                matchDiv.innerHTML = `
                    <div class="text-white text-base">
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

    private showNextMatch(): void {
        const currentMatch = this.tournamentState.matches[this.tournamentState.currentMatch];
        if (!currentMatch) {
            this.showTournamentResults();
            return;
        }

        const currentMatchDiv = document.getElementById('currentMatch');
        const matchInfo = document.getElementById('matchInfo');
        
        if (currentMatchDiv) currentMatchDiv.classList.remove('hidden');
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

    private startCurrentMatch(): void {
        const currentMatch = this.tournamentState.matches[this.tournamentState.currentMatch];
        if (!currentMatch) return;

        // Hide current match section
        const currentMatchDiv = document.getElementById('currentMatch');
        if (currentMatchDiv) currentMatchDiv.classList.add('hidden');

        // Show the game section and initialize the actual game
        this.showSection('gameSection');
        
        // Set up the game with tournament players
        setTimeout(() => {
            this.initializeTournamentGame(currentMatch);
        }, 100);
    }

    private initializeTournamentGame(match: {player1: string, player2: string, winner?: string}): void {
        console.log('=== INITIALIZING TOURNAMENT GAME ===');
        
        // Set up the game canvas and controls
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        const startButton = document.getElementById('startButton');
        const gameOverlay = document.getElementById('gameOverlay');
        const gameMessage = document.getElementById('gameMessage');
        const player1Name = document.getElementById('player1Name');
        const player2Name = document.getElementById('player2Name');

        console.log('Tournament game elements found:', {
            canvas: !!canvas,
            ctx: !!ctx,
            startButton: !!startButton,
            gameOverlay: !!gameOverlay,
            gameMessage: !!gameMessage,
            player1Name: !!player1Name,
            player2Name: !!player2Name
        });

        if (!canvas || !ctx || !startButton || !gameOverlay || !gameMessage || !player1Name || !player2Name) {
            console.error('Tournament game elements not found');
            return;
        }

        // Reset game state completely
        this.resetGameState();

        // Set tournament player names
        player1Name.textContent = match.player1;
        player2Name.textContent = match.player2;

        // Reset scores
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        if (player1Score) player1Score.textContent = '0';
        if (player2Score) player2Score.textContent = '0';

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

    private initializeGameControls(): void {
        // Set up start button event listener
        const startButton = document.getElementById('startButton');
        if (startButton) {
            // Remove existing listeners
            const newStartButton = startButton.cloneNode(true) as HTMLButtonElement;
            startButton.parentNode?.replaceChild(newStartButton, startButton);
            
            newStartButton.addEventListener('click', () => {
                console.log('Tournament game start button clicked');
                this.startLocalGame();
            });
        }

        // Set up customize button event listener
        const customizeBtn = document.getElementById('customizeBtn');
        if (customizeBtn) {
            // Remove existing listeners
            const newCustomizeBtn = customizeBtn.cloneNode(true) as HTMLButtonElement;
            customizeBtn.parentNode?.replaceChild(newCustomizeBtn, customizeBtn);
            
            newCustomizeBtn.addEventListener('click', () => {
                console.log('Tournament customize button clicked');
                this.showCustomizationModal();
            });
        }

        // Set up keyboard controls
        this.setupGameControls();
    }

    private setupTournamentGameEndHandler(): void {
        // Store original endGame method
        this.originalEndGame = this.endGame;
        
        // Override the normal game end to handle tournament progression
        this.endGame = async (winner: number) => {
            // Don't call original endGame - we don't want the "Play Again/Go Home" UI
            // Just handle tournament progression immediately
            this.handleTournamentGameEnd(winner);
        };
    }

    private handleTournamentGameEnd(winner: number): void {
        const currentMatch = this.currentTournamentMatch;
        if (!currentMatch) return;

        // Convert winner number to player name
        const winnerName = winner === 1 ? currentMatch.player1 : currentMatch.player2;
        currentMatch.winner = winnerName;

        // Update bracket display
        this.displayBracket();

        // Go directly to tournament section
        this.showSection('localTournamentSection');

        // Hide game section
        const gameSection = document.getElementById('gameSection');
        if (gameSection) gameSection.classList.remove('active');

        // Check if this was the last match in the current round
        if (this.tournamentState.currentMatch >= this.tournamentState.matches.length - 1) {
            // Round is complete, automatically advance to next round
            setTimeout(() => {
                this.nextMatch();
            }, 1500); // Show result briefly, then advance
        } else {
            // Show match results section for current round
            const matchResults = document.getElementById('matchResults');
            if (matchResults) matchResults.classList.remove('hidden');

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

        this.showStatus(`${winnerName} wins the match!`, 'success');
    }

    private showTournamentMatchResults(match: {player1: string, player2: string, winner?: string}, winner: string): void {
        // Go back to tournament section
        this.showSection('localTournamentSection');

        // Hide game section
        const gameSection = document.getElementById('gameSection');
        if (gameSection) gameSection.classList.remove('active');

        // Show match results section
        const matchResults = document.getElementById('matchResults');
        if (matchResults) matchResults.classList.remove('hidden');

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

    private nextMatch(): void {
        this.tournamentState.currentMatch++;
        
        // Hide results section
        const matchResults = document.getElementById('matchResults');
        if (matchResults) matchResults.classList.add('hidden');

        // Check if current round is complete
        if (this.tournamentState.currentMatch >= this.tournamentState.matches.length) {
            // Round is complete, generate next round
            this.generateNextRound();
        } else {
            // Show next match in current round
            this.showNextMatch();
        }
    }

    private generateNextRound(): void {
        const currentRound = this.tournamentState.bracket[this.tournamentState.currentRound];
        const winners = currentRound.map(match => match.winner).filter(Boolean) as string[];
        
        // Only end tournament if we have exactly 1 winner
        if (winners.length === 1) {
            // Tournament complete
            this.showTournamentResults();
            return;
        }

        // Generate next round matches
        const nextRound: Array<{player1: string, player2: string, winner?: string}> = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                nextRound.push({
                    player1: winners[i],
                    player2: winners[i + 1],
                    winner: undefined
                });
            }
        }

        this.tournamentState.bracket.push(nextRound);
        this.tournamentState.matches = [...nextRound];
        this.tournamentState.currentRound++;
        this.tournamentState.currentMatch = 0;

        this.displayBracket();
        this.showNextMatch();
    }

    private showTournamentResults(): void {
        const currentRound = this.tournamentState.bracket[this.tournamentState.currentRound];
        const winner = currentRound[0]?.winner;

        if (!winner) return;

        // Hide all other sections
        const sections = ['playerNamesForm', 'tournamentBracket', 'currentMatch', 'matchResults'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });

        // Show results
        const tournamentResults = document.getElementById('tournamentResults');
        const championInfo = document.getElementById('championInfo');
        
        if (tournamentResults) tournamentResults.classList.remove('hidden');
        if (championInfo) {
            // Create comprehensive tournament summary
            const playerCount = this.tournamentState.players.length;
            const allPlayers = this.tournamentState.players.join(', ');
            
            championInfo.innerHTML = `
                <div class="text-4xl mb-4">🏆</div>
                <div class="text-3xl font-bold text-powerpuff-green mb-4">${winner}</div>
                <div class="text-lg text-white mb-6">Tournament Champion!</div>
                
                <div class="bg-white/20 rounded-lg p-4 mb-6">
                    <div class="text-lg font-bold text-white mb-2">Tournament Summary</div>
                    <div class="text-sm text-gray-300 mb-2">Number of Players: ${playerCount}</div>
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
            const goHomeBtn = document.createElement('button');
            goHomeBtn.className = 'bg-powerpuff-pink hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg ml-4';
            goHomeBtn.textContent = '🏠 Go Home';
            goHomeBtn.addEventListener('click', () => {
                this.showSection('homeSection');
                this.resetTournament();
            });
            buttonContainer.appendChild(goHomeBtn);
        }

        this.showStatus(`🏆 ${winner} is the Tournament Champion!`, 'success');
    }

    private resetTournament(): void {
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
        const tournament8Players = document.getElementById('tournament8Players');
        if (tournament4Players) tournament4Players.style.display = 'block';
        if (tournament8Players) tournament8Players.style.display = 'block';

        // Hide all sections
        const sections = ['playerNamesForm', 'tournamentBracket', 'currentMatch', 'matchResults', 'tournamentResults'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });

        this.showStatus('Tournament reset. Select number of players to start a new tournament.', 'info');
    }

    private initializeRemoteGame(): void {
        console.log('=== INITIALIZING REMOTE GAME ===');
        
        // Set up the online game canvas and controls for remote game
        const canvas = document.getElementById('onlineGameCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        const startButton = document.getElementById('onlineStartButton');
        const gameOverlay = document.getElementById('onlineGameOverlay');
        const gameMessage = document.getElementById('onlineGameMessage');
        const player1Name = document.getElementById('onlinePlayer1Name');
        const player2Name = document.getElementById('onlinePlayer2Name');
        const customizeButton = document.getElementById('onlineCustomizeBtn');

        console.log('Remote game elements found:', {
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
            console.error('Remote game elements not found');
            return;
        }

        // Reset game state
        this.resetGameState();

        // Set player names
        player1Name.textContent = this.currentUser.username || 'Player 1';
        player2Name.textContent = 'Remote Player';

        // Reset scores
        const player1Score = document.getElementById('onlinePlayer1Score');
        const player2Score = document.getElementById('onlinePlayer2Score');
        if (player1Score) player1Score.textContent = '0';
        if (player2Score) player2Score.textContent = '0';

        // Hide matchmaking status
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        if (matchmakingStatus) {
            matchmakingStatus.style.display = 'none';
        }

        // Hide matchmaking controls
        const matchmakingControls = document.querySelector('#onlineGameSection .flex.justify-center.space-x-4');
        if (matchmakingControls) {
            (matchmakingControls as HTMLElement).style.display = 'none';
        }

        // Show the score display
        const scoreDisplay = document.querySelector('#onlineGameSection .text-center.text-white.mb-8:nth-child(3)') as HTMLElement;
        if (scoreDisplay) {
            scoreDisplay.style.display = 'block';
        }

        // Initialize remote game state
        this.initializeRemoteGameState();

        // Set up remote game controls
        this.setupRemoteGameControls();

        // Initialize remote game canvas
        this.initializeRemoteGameCanvas();

        // Connect to remote game
        this.connectToRemoteGame();

        // Set up input handling
        this.setupRemoteGameInput();

        console.log('Remote game initialized successfully');
    }

    private initializeRemoteGameState(): void {
        this.onlineGameState = {
            matchmakingSocket: null,
            gameSocket: null,
            matchId: 1, // Default match ID for remote game
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

    private setupRemoteGameControls(): void {
        const startButton = document.getElementById('onlineStartButton');
        const customizeButton = document.getElementById('onlineCustomizeBtn');

        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Remote game start button clicked');
                const gameOverlay = document.getElementById('onlineGameOverlay');
                if (gameOverlay) {
                    gameOverlay.style.display = 'none';
                }
            });
        }

        if (customizeButton) {
            customizeButton.addEventListener('click', () => {
                console.log('Remote game customize button clicked');
                this.showCustomizationModal();
            });
        }
    }

    private initializeRemoteGameCanvas(): void {
        const canvas = document.getElementById('onlineGameCanvas') as HTMLCanvasElement;
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

    private drawRemoteGame(): void {
        const canvas = document.getElementById('onlineGameCanvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        if (!canvas || !ctx) return;

        // Clear canvas
        ctx.fillStyle = '#0f0f23';
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
        
        // Left paddle
        ctx.fillStyle = (this.onlineGameState.playerNumber === 1) ? myPaddleColor : opponentPaddleColor;
        ctx.fillRect(50, this.onlineGameState.gameState.leftPaddleY, 15, 100);
        
        // Right paddle
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
        } else if (this.onlineGameState.playerNumber === 2) {
            ctx.strokeStyle = this.customizationSettings.myPaddleColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(733, this.onlineGameState.gameState.rightPaddleY - 2, 19, 104);
            
            // Add glow effect
            ctx.shadowColor = this.customizationSettings.myPaddleColor;
            ctx.shadowBlur = 10;
            ctx.strokeRect(733, this.onlineGameState.gameState.rightPaddleY - 2, 19, 104);
            ctx.shadowBlur = 0;
        }
    }

    private connectToRemoteGame(): void {
        console.log('Connecting to remote game...');
        
        const matchId = this.onlineGameState.matchId;
        const username = this.currentUser?.username || 'Anonymous';
        const wsUrl = `ws://localhost/simple-remote/${matchId}?username=${encodeURIComponent(username)}`;
        
        console.log('Connecting to:', wsUrl);

        try {
            this.onlineGameState.gameSocket = new WebSocket(wsUrl);

            this.onlineGameState.gameSocket.onopen = (event) => {
                console.log('✅ Connected to remote game server!');
                this.onlineGameState.isConnected = true;
                this.updateRemoteGameStatus('Connected', 'WebSocket connection established');
            };

            this.onlineGameState.gameSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 Received remote game message:', data);
                    console.log('📨 Message type:', data.type);
                    
                    switch(data.type) {
                        case 'success':
                            this.onlineGameState.playerNumber = data.playerNumber;
                            this.updateRemoteGameStatus(`Connected as Player ${data.playerNumber}`, 'Waiting for opponent...');
                            this.updatePlayerNames(data.player1Username, data.player2Username);
                            console.log(`🎮 Assigned as Player ${data.playerNumber}`);
                            break;
                            
                        case 'waiting':
                            console.log('⏳ Waiting for opponent...');
                            this.showWaitingForOpponent();
                            break;
                            
                        case 'ready':
                            console.log('🎯 Game ready! Both players connected.');
                            this.hideWaitingForOpponent();
                            this.showRemoteGameMessage('Both players ready! Game starting...');
                            // Update player names with the final usernames
                            if (data.player1Username && data.player2Username) {
                                this.updatePlayerNames(data.player1Username, data.player2Username);
                            }
                            break;
                            
                        case 'countdown':
                            console.log(`⏰ Countdown: ${data.count}`);
                            this.showCountdown(data.count);
                            break;
                            
                        case 'game-start':
                            console.log('🚀 Game started!');
                            this.hideCountdown();
                            this.startRemoteGame();
                            break;
                            
                        case 'game-state':
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
                                const winner = data.player1Score >= 5 ? data.player1Username : data.player2Username;
                                const winnerScore = data.player1Score >= 5 ? data.player1Score : data.player2Score;
                                const loserScore = data.player1Score >= 5 ? data.player2Score : data.player1Score;
                                
                                this.onlineGameState.gameFinished = true;
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
                            console.log(`🏆 Game Over! ${data.winner} wins!`);
                            console.log('📊 Game over data:', data);
                            this.onlineGameState.gameFinished = true;
                            this.showGameOverScreen({
                                winner: data.winner,
                                winnerScore: data.winnerScore,
                                loserScore: data.loserScore,
                                player1Username: data.player1Username,
                                player2Username: data.player2Username
                            });
                            // Refresh user data to update dashboard
                            this.refreshUserData();
                            break;
                            
                        case 'disconnect':
                            console.log(`❌ ${data.message}`);
                            break;
                            
                        case 'error':
                            console.log(`🚨 Server Error: ${data.message}`);
                            break;
                            
                        default:
                            console.log(`❓ Unknown message type: ${data.type}`);
                    }
                } catch (e) {
                    console.log(`📨 Received raw message: ${event.data}`);
                }
            };

            this.onlineGameState.gameSocket.onclose = (event) => {
                console.log(`🔌 Remote game connection closed: ${event.code} ${event.reason}`);
                this.onlineGameState.isConnected = false;
                
                // Only show disconnect message if game wasn't finished
                if (!this.onlineGameState.gameFinished) {
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

        } catch (error) {
            console.log(`❌ Failed to create remote game WebSocket: ${(error as Error).message}`);
            this.updateRemoteGameStatus('Error', 'Failed to create WebSocket connection');
        }
    }

    private updateRemoteGameStatus(status: string, info: string): void {
        const statusElement = document.getElementById('matchmakingStatus');
        if (statusElement) {
            const showSpinner = info.includes('Waiting') || info.includes('Searching');
            const icon = status === 'Connected' ? '✅' : status === 'Error' ? '❌' : '🔌';
            const color = status === 'Connected' ? 'text-powerpuff-green' : status === 'Error' ? 'text-powerpuff-red' : 'text-white';
            
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
    }

    private updateRemoteScore(): void {
        const player1Score = document.getElementById('onlinePlayer1Score');
        const player2Score = document.getElementById('onlinePlayer2Score');
        
        // Show scores based on player number (Player 1 is left paddle, Player 2 is right paddle)
        if (this.onlineGameState.playerNumber === 1) {
            // Player 1 sees: [MyScore] VS [OpponentScore]
            if (player1Score) {
                player1Score.textContent = this.onlineGameState.gameState.player1Score.toString();
            }
            if (player2Score) {
                player2Score.textContent = this.onlineGameState.gameState.player2Score.toString();
            }
        } else if (this.onlineGameState.playerNumber === 2) {
            // Player 2 sees: [OpponentScore] VS [MyScore]
            if (player1Score) {
                player1Score.textContent = this.onlineGameState.gameState.player2Score.toString();
            }
            if (player2Score) {
                player2Score.textContent = this.onlineGameState.gameState.player1Score.toString();
            }
        }
    }

    private showRemoteGameMessage(message: string): void {
        const gameMessage = document.getElementById('onlineGameMessage');
        const gameOverlay = document.getElementById('onlineGameOverlay');
        
        if (gameMessage) {
            gameMessage.textContent = message;
        }
        if (gameOverlay) {
            gameOverlay.style.display = 'flex';
        }
    }

    private hideRemoteGameMessage(): void {
        const gameOverlay = document.getElementById('onlineGameOverlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
        }
    }

    private setupRemoteGameInput(): void {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!this.onlineGameState.gameSocket || this.onlineGameState.gameSocket.readyState !== WebSocket.OPEN) return;
            
            switch(event.key) {
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

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!this.onlineGameState.gameSocket || this.onlineGameState.gameSocket.readyState !== WebSocket.OPEN) return;
            
            switch(event.key) {
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

    private sendRemoteInput(inputType: string, key: string): void {
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

    private updatePlayerNames(player1Name: string, player2Name: string): void {
        const player1NameElement = document.getElementById('onlinePlayer1Name');
        const player2NameElement = document.getElementById('onlinePlayer2Name');
        
        // Show names based on player number (Player 1 is left paddle, Player 2 is right paddle)
        if (this.onlineGameState.playerNumber === 1) {
            // Player 1 sees: [MyName] VS [OpponentName]
            if (player1NameElement) {
                player1NameElement.textContent = player1Name;
            }
            if (player2NameElement) {
                player2NameElement.textContent = player2Name;
            }
        } else if (this.onlineGameState.playerNumber === 2) {
            // Player 2 sees: [OpponentName] VS [MyName]
            if (player1NameElement) {
                player1NameElement.textContent = player2Name;
            }
            if (player2NameElement) {
                player2NameElement.textContent = player1Name;
            }
        }
    }

    private showWaitingForOpponent(): void {
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

    private hideWaitingForOpponent(): void {
        const statusElement = document.getElementById('matchmakingStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }

    private showCountdown(count: number): void {
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

    private hideCountdown(): void {
        const gameOverlay = document.getElementById('onlineGameOverlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
        }
    }

    private startRemoteGame(): void {
        console.log('🎮 Starting remote game...');
        
        // Show the score display
        const scoreDisplay = document.querySelector('#onlineGameSection .text-center.text-white.mb-8');
        if (scoreDisplay) {
            (scoreDisplay as HTMLElement).style.display = 'block';
        }
        
        // Show the game canvas
        const gameContainer = document.querySelector('#onlineGameSection .flex.justify-center.mb-8');
        if (gameContainer) {
            (gameContainer as HTMLElement).style.display = 'flex';
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

    private showGameOverScreen(data: any): void {
        const gameMessage = document.getElementById('onlineGameMessage');
        const gameOverlay = document.getElementById('onlineGameOverlay');
        
        if (gameMessage) {
            gameMessage.innerHTML = `
                <div class="text-center">
                    <h2 class="text-3xl font-bold mb-4 text-white drop-shadow-lg">🏆 Game Over!</h2>
                    <p class="text-xl mb-4 text-white">${data.winner} wins!</p>
                </div>
            `;
        }
        
        if (gameOverlay) {
            gameOverlay.style.display = 'flex';
            
            // Remove any existing buttons to prevent duplicates
            const existingButtons = gameOverlay.querySelectorAll('button');
            existingButtons.forEach(button => button.remove());
            
            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-center space-x-4 mt-6';
            
            // Add "Play Again" button
            const playAgainButton = document.createElement('button');
            playAgainButton.className = 'bg-powerpuff-green hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors shadow-lg';
            playAgainButton.textContent = '🎮 Play Again';
            playAgainButton.onclick = () => {
                this.restartRemoteGame();
            };
            
            // Add "Go Home" button
            const goHomeButton = document.createElement('button');
            goHomeButton.className = 'bg-powerpuff-red hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors shadow-lg';
            goHomeButton.textContent = '🏠 Go Home';
            goHomeButton.onclick = () => {
                this.goHome();
            };
            
            // Add buttons to container
            buttonContainer.appendChild(playAgainButton);
            buttonContainer.appendChild(goHomeButton);
            
            // Add container to overlay
            gameOverlay.appendChild(buttonContainer);
        }
    }

    private restartRemoteGame(): void {
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
        
        // Hide game over screen
        this.hideRemoteGameMessage();
        
        // Reconnect to game
        if (this.onlineGameState.gameSocket) {
            this.onlineGameState.gameSocket.close();
        }
        
        setTimeout(() => {
            this.connectToRemoteGame();
        }, 1000);
    }

    private goHome(): void {
        console.log('Going home...');
        
        // Close game connection
        if (this.onlineGameState.gameSocket) {
            this.onlineGameState.gameSocket.close();
        }
        
        // Reset game state
        this.onlineGameState = {
            matchmakingSocket: null,
            gameSocket: null,
            matchId: 1,
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
        
        // Show home section
        this.showSection('homeSection');
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

    private setupMatchmakingControls(): void {
        const cancelMatchmakingBtn = document.getElementById('cancelMatchmakingBtn');
        if (cancelMatchmakingBtn) {
            cancelMatchmakingBtn.addEventListener('click', () => {
                this.cancelMatchmaking();
            });
        }
    }

    private startMatchmaking(): void {
        console.log('Starting matchmaking...');
        
        try {
            // Connect to matchmaking WebSocket
            const matchmakingSocket = new WebSocket('ws://localhost/api/matchmaking');
            
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
                    } else if (data.type === 'queue-status') {
                        console.log('Queue status update:', data.status);
                        this.updateMatchmakingStatus(`Players in queue: ${data.status.waitingPlayers}`, 'searching');
                    } else if (data.type === 'joined-queue') {
                        console.log('Successfully joined queue');
                        this.updateMatchmakingStatus('Joined matchmaking queue. Searching for opponent...', 'searching');
                    } else if (data.type === 'ping') {
                        console.log('Received ping from server');
                        // Send pong response to keep connection alive
                        matchmakingSocket.send(JSON.stringify({
                            type: 'pong',
                            timestamp: data.timestamp
                        }));
                    } else {
                        console.log('Unknown message type:', data.type);
                    }
                } catch (error) {
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

        } catch (error) {
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

    private handleMatchFound(data: any): void {
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

    private connectToGame(matchId: number): void {
        console.log('Connecting to game:', matchId);
        
        try {
            const gameSocket = new WebSocket(`ws://localhost/api/remote-game/${matchId}`);
            
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
                } else if (data.type === 'ready') {
                    this.handleGameReady(data);
                } else if (data.type === 'input-update') {
                    this.handleInputUpdate(data);
                } else if (data.type === 'disconnect') {
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

        } catch (error) {
            console.error('Failed to connect to game:', error);
            this.updateMatchmakingStatus('Failed to connect to game.', 'error');
        }
    }

    private handleGameSuccess(data: any): void {
        this.onlineGameState.playerNumber = data.playerNumber;
        this.updateMatchmakingStatus(`You are Player ${data.playerNumber}`, 'connected');
        
        // Update player names display
        const player1Name = document.getElementById('onlinePlayer1Name');
        const player2Name = document.getElementById('onlinePlayer2Name');
        if (player1Name) player1Name.textContent = data.player1Username || 'Player 1';
        if (player2Name) player2Name.textContent = data.player2Username || 'Player 2';
    }

    private handleGameReady(data: any): void {
        this.updateMatchmakingStatus('Both players ready! Game starting...', 'ready');
        
        // Show game canvas and hide matchmaking
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        const scoreDisplay = document.querySelector('.text-center.text-white.mb-8');
        const gameContainer = document.querySelector('.flex.justify-center.mb-8');
        
        if (matchmakingStatus) matchmakingStatus.style.display = 'none';
        if (scoreDisplay) (scoreDisplay as HTMLElement).style.display = 'block';
        if (gameContainer) (gameContainer as HTMLElement).style.display = 'flex';
        
        // Initialize online game canvas
        this.initializeOnlineGameCanvas();
    }

    private handleInputUpdate(data: any): void {
        // Handle real-time game state updates
        console.log('Input update:', data);
        // This will be implemented when we add the actual game rendering
    }

    private handlePlayerDisconnect(data: any): void {
        this.updateMatchmakingStatus('Opponent disconnected.', 'error');
        this.onlineGameState.isInMatch = false;
        
        // Show matchmaking again
        const matchmakingStatus = document.getElementById('matchmakingStatus');
        if (matchmakingStatus) matchmakingStatus.style.display = 'block';
    }

    private cancelMatchmaking(): void {
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

    private updateMatchmakingStatus(message: string, status: 'searching' | 'connected' | 'ready' | 'error' | 'cancelled' | 'ended'): void {
        const statusElement = document.getElementById('matchmakingStatus');
        if (!statusElement) return;

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

    private initializeOnlineGameCanvas(): void {
        const canvas = document.getElementById('onlineGameCanvas') as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas for online game
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add game controls
        this.setupOnlineGameControls();
    }

    private setupOnlineGameControls(): void {
        // Handle keyboard input for online game
        document.addEventListener('keydown', (e) => {
            if (!this.onlineGameState.gameSocket || !this.onlineGameState.isInMatch) return;

            let key = '';
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                key = 'up';
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                key = 'down';
            } else {
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
            if (!this.onlineGameState.gameSocket || !this.onlineGameState.isInMatch) return;

            let key = '';
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                key = 'up';
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                key = 'down';
            } else {
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