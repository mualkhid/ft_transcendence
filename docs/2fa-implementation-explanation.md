# Two-Factor Authentication (2FA) Implementation Deep Dive

This document explains the detailed implementation of the 2FA setup and verification process in the frontend application.

## Overview

The 2FA system uses Time-based One-Time Passwords (TOTP) with QR codes for easy setup and backup codes for account recovery. It follows industry standards for secure authentication.

## Method 1: setup2FA() - Initial 2FA Setup

### Purpose
This method initiates the 2FA setup process by communicating with the backend to generate a QR code and backup codes.

### Step-by-Step Breakdown

#### 1. Backend Communication
```typescript
const response = await fetch(`api/auth/setup-2fa`, { 
    method: 'POST', 
    credentials: 'include' 
});
```

**What happens here:**
- Sends a POST request to the backend's 2FA setup endpoint
- `credentials: 'include'` ensures authentication cookies are sent
- Backend generates a secret key and creates QR code data
- Backend also generates 10 backup codes for account recovery

#### 2. Response Processing
```typescript
const data = await response.json();
```

**Expected response structure:**
```json
{
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "backupCodes": [
    "123456789",
    "987654321",
    // ... 8 more codes
  ]
}
```

#### 3. UI State Management - Instructions Display
```typescript
const instructionsDiv = document.getElementById('twofa-instructions');
if (instructionsDiv) instructionsDiv.style.display = 'block';
```

**Purpose:**
- Shows step-by-step instructions to the user
- Guides them through the QR code scanning process
- Explains how to save backup codes safely

#### 4. QR Code Display
```typescript
const qrImage = document.getElementById('qrImage') as HTMLImageElement;
if (qrImage) qrImage.src = data.qr;
```

**What the QR code contains:**
- A special URL format: `otpauth://totp/AppName:username?secret=BASE32SECRET&issuer=AppName`
- When scanned by authenticator apps (Google Authenticator, Authy, etc.)
- The app can generate 6-digit codes that change every 30 seconds

#### 5. Backup Codes Generation and Display
```typescript
const backupCodesList = document.getElementById('backupCodes');
if (backupCodesList) {
    backupCodesList.innerHTML = '';
    data.backupCodes.forEach((code: string) => {
        const li = document.createElement('li');
        li.textContent = code;
        li.className = 'bg-gray-700 p-2 rounded font-mono text-sm mb-1';
        backupCodesList.appendChild(li);
    });
}
```

**Backup codes purpose:**
- **Recovery mechanism**: If user loses their phone or authenticator app
- **One-time use**: Each code can only be used once
- **Styled display**: Monospace font for easy reading and copying
- **User responsibility**: User must save these codes securely

#### 6. Setup Section Visibility
```typescript
const twofaSetupSection = document.getElementById('twofa-setup');
if (twofaSetupSection) twofaSetupSection.style.display = 'block';
```

**Shows the verification interface:**
- Input field for entering the 6-digit code
- Verify button to complete setup
- Instructions for using the authenticator app

#### 7. UI Controls Disabled During Setup
```typescript
const enable2faBtn = document.getElementById('enable2faBtn');
if (enable2faBtn) enable2faBtn.style.display = 'none';

const twoFactorToggle = document.getElementById('twoFactorToggle') as HTMLInputElement;
if (twoFactorToggle) twoFactorToggle.disabled = true;
```

**Security measure:**
- Prevents user from accidentally triggering setup again
- Ensures they must complete the current setup process
- Maintains UI state consistency

## Method 2: verify2FA() - Verification and Completion

### Purpose
This method completes the 2FA setup by verifying that the user can successfully generate codes with their authenticator app.

### Step-by-Step Breakdown

#### 1. Input Validation
```typescript
const verifyCodeInput = document.getElementById('verify2faCode') as HTMLInputElement;
const twoFactorCode = verifyCodeInput?.value;

if (!twoFactorCode) {
    this.showStatus('Please enter the 6-digit code from your authenticator app', 'error');
    return;
}
```

**Validation checks:**
- Ensures user entered a code
- Provides clear error message if empty
- Prevents unnecessary API calls

#### 2. Verification Request
```typescript
const response = await fetch(`api/auth/verify-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ twoFactorCode }),
    credentials: 'include',
});
```

**Backend verification process:**
- Receives the 6-digit code from user
- Calculates expected code based on stored secret and current time
- Allows for small time window variance (usually ±30 seconds)
- Returns success/failure and updated user data

#### 3. Success Handling
```typescript
if (response.ok) {
    const data = await response.json();
    this.showStatus('2FA setup complete!', 'success');
    
    // Hide setup sections
    const twofaSetupSection = document.getElementById('twofa-setup');
    if (twofaSetupSection) twofaSetupSection.style.display = 'none';
    
    const instructionsDiv = document.getElementById('twofa-instructions');
    if (instructionsDiv) instructionsDiv.style.display = 'none';
```

**UI cleanup:**
- Hides the setup interface
- Removes instructions from view
- Shows success message to user

#### 4. Toggle State Update
```typescript
const twoFactorToggle = document.getElementById('twoFactorToggle') as HTMLInputElement;
if (twoFactorToggle) {
    twoFactorToggle.disabled = false;
    twoFactorToggle.checked = true;
}
```

**State synchronization:**
- Re-enables the 2FA toggle control
- Sets toggle to "enabled" state
- Reflects that 2FA is now active on the account

#### 5. User Data Update
```typescript
this.currentUser = data.user;
localStorage.setItem('user', JSON.stringify(data.user));
```

**Data persistence:**
- Updates local user object with 2FA enabled status
- Saves to localStorage for session persistence
- Ensures UI stays consistent across page reloads

#### 6. Input Field Cleanup
```typescript
verifyCodeInput.value = '';
```

**Security practice:**
- Clears the verification code from the input field
- Prevents the code from being visible or reused
- Good UX practice for sensitive data

## Security Considerations

### Time-Window Synchronization
- TOTP codes are valid for 30-second windows
- Backend typically accepts codes from current and previous windows
- Prevents issues with slight clock differences

### Backup Codes Security
- Generated using cryptographically secure random number generation
- Each code is single-use only
- User is responsible for secure storage

### Error Handling
- Generic error messages to prevent information leakage
- Network errors handled gracefully
- UI state maintained even during failures

## Integration with Login Flow

### Enhanced Login Process
After 2FA is enabled, the login flow becomes:
1. User enters email/password
2. Backend validates credentials
3. If 2FA is enabled, backend responds with `require2FA: true`
4. Frontend shows 2FA input field
5. User enters 6-digit code or backup code
6. Backend validates 2FA code
7. If successful, user is logged in

### Session Management
- 2FA verification is required for each login session
- No persistent "remember 2FA" option for security
- Session tokens still have normal expiration times

## User Experience Flow

### First-Time Setup
1. User toggles 2FA switch to "enabled"
2. "Enable 2FA" button appears
3. User clicks button → `setup2FA()` is called
4. QR code and backup codes are displayed
5. User scans QR code with authenticator app
6. User enters first code → `verify2FA()` is called
7. Setup complete, toggle becomes functional

### Ongoing Usage
1. User logs in with email/password
2. System prompts for 2FA code
3. User opens authenticator app
4. User enters current 6-digit code
5. System validates and grants access

This implementation provides a secure, user-friendly 2FA system that follows industry best practices while maintaining a smooth user experience.
