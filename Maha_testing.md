# USER MANAGEMENT

### 1. Subject compliance
   * Secure subscription and login with unique username / email ✅
   * Avatar upload with default fallback ❌
   * Profile editing (username, password, avatar) 
   * change avatar with: invalid file / large file / normal file ✅
   * change username with: same / invalid characters / too long / too short. ❌ -> add maxLength + minLength to registerSchema
   * change password: old, not matching the requirements
   * Friends system: add, accept/decline, block/unblock  ✅ We will remove the block route from backend
   * Match history: wins, losses, dates, game details ❌ entries for dashboard sometimes are wrong.
### 2. Test case 1 – User registration & login
   - Register with valid data → user created, auto-login optional  
   - username: invalid, existing ✅ change the message for invalid
   - email: invalid, existing ✅
   - password: invalid ✅
   - Login with correct credentials → session / JWT issued ✅
   - Login with wrong password → denied ✅

### 3. Test case 2 – Profile update
   - Change username → reflected in DB and UI  
   - Upload avatar (jpg/png) → stored, shown, old file cleaned up  
   - Try malicious filename or script tag → rejected / sanitized

### 4. Test case 3 – Friends feature
   - Send request → shows in recipient pending list  
   - Accept → both appear in current friends  
   - Block → friend removed, blocked list updated  
   - Unblock → moves back to search/addable state

### 5. Test case 4 – Match history & stats
   - Play games → history records type, date, score  
   - Query history via API → accurate and paginated  
   - Stats (wins/losses) update automatically

### 6. Test case 5 – Security checks
   - All passwords hashed (e.g., bcrypt/argon2)  
   - CSRF/XSS/SQL-injection attempts → no data leak or crash  
   - HTTPS/WSS enforced

# DATABASE
### 1. Subject compliance
   * SQLite database used for persistence  
   * Logical schema with relations: users, friends, matches, sessions  
   * All queries parameterized (SQL injection resistant)  
   * Handles concurrent writes safely

### 2. Test case 1 – Schema integrity
   - Migrate DB from scratch → all tables/indices created  
   - Foreign keys enforce cascading deletes/updates

### 3. Test case 2 – Data correctness
   - Insert / update / delete users and matches → referential integrity maintained  
   - Simulate tournament with multiple users → consistent results

### 4. Test case 3 – Performance & recovery
   - Handle 1000+ users & games → acceptable query times  
   - Backup & restore DB file → system works with restored copy

### 5. Test case 4 – Security
   - Attempt raw SQL injection → rejected  
   - Verify sensitive fields (password hash, tokens) are never stored in plain text

# DOCKER SETUP
### 1. Subject compliance
   * Entire app (backend, frontend, DB) runs with `docker compose up -d`  
   * Works in rootless mode as required by campus clusters  
   * No bind-mount dependency; volumes handled internally  
   * Environment variables (.env) excluded from Git and injected at runtime

### 2. Test case 1 – Build and run
   - `docker compose up --build` on a clean machine → containers start without manual steps

### 3. Test case 2 – Network & volumes
   - Containers communicate through internal network  
   - Data persists across container restarts

### 4. Test case 3 – Security & secrets
   - .env not in Git history  
   - Secrets only accessed via environment or Vault (if used)  
   - Verify no sensitive info leaks to logs

### 5. Test case 4 – Multi-environment
   - Run in development and production modes → correct env settings applied

# GENERAL SERVER SETUP
### 1. Subject compliance
   * HTTPS enforced for all routes (redirect HTTP → HTTPS)  
   * WebSockets use `wss://`  
   * Global error handler prevents unhandled exceptions  
   * Rate limiting and input validation applied to all endpoints

### 2. Test case 1 – Deployment sanity
   - Clone repo and run `docker compose up` → site reachable at `https://host/`  
   - All static assets load without 404

### 3. Test case 2 – Security hardening
   - Attempt XSS/CSRF → blocked  
   - Verify correct CORS configuration  
   - Certificates auto-renew or valid at least 90 days

### 4. Test case 3 – Monitoring & logs (if implemented)
   - Centralized logs accessible through Docker or ELK stack  
   - Simulated error appears in logs and triggers alert

### 5. Test case 4 – Performance smoke tests
   - 100+ concurrent game sessions → stable response times  
   - Simulate sudden container restart → automatic recovery with no data loss
