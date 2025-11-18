          # Nginx Configuration Explained

## What This File Does

This nginx configuration acts as a **reverse proxy** - it sits between users and your app, deciding where to send different requests.

## Section Breakdown

### Events Block
```nginx
events {
    worker_connections 1024;
}
```
- **Purpose**: Handles how many connections nginx can handle at once
- **1024**: Maximum connections per worker process (plenty for most apps)

### HTTP Block Setup
```nginx
proxy_http_version 1.1;
proxy_set_header X-Real-IP        $remote_addr;
proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host             $host;
```
- **Purpose**: Sets up headers so your backend knows who the real user is
- **Why needed**: Without these, your backend would think nginx is the user

### Upstream Servers
```nginx
upstream frontend_app { server frontend:80; }
upstream backend_api  { server backend:3000; }
```
- **frontend_app**: Points to the frontend container on port 80
- **backend_api**: Points to the backend container on port 3000
- **Purpose**: Defines where to send different types of requests

### HTTPS Server (Port 443)
```nginx
server {
    listen 443 ssl http2;
    server_name localhost _;
    
    ssl_certificate     /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
```
- **Handles**: Secure HTTPS traffic
- **SSL certificates**: Enable encrypted connections

### Request Routing Rules

#### Special API Endpoints (WebSocket)
```nginx
location ~ ^/api/(find-match|remote-game|ws-test|ai-game) {
    proxy_pass http://backend_api;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
- **For**: Real-time features like games, matches
- **Special headers**: Enable WebSocket connections (live updates)

#### Avatar Images
```nginx
location /avatars/ {
    proxy_pass http://backend_api;
}
```
- **For**: User profile pictures
- **Goes to**: Backend (where images are stored)

#### All Other API Calls
```nginx
location /api/ {
    proxy_pass http://backend_api;
}
```
- **For**: Regular API requests (login, data, etc.)
- **Goes to**: Backend

#### Everything Else
```nginx
location / {
    proxy_pass http://frontend_app;
}
```
- **For**: Website pages, CSS, JavaScript
- **Goes to**: Frontend

### HTTP Redirect Server (Port 80)
```nginx
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```
- **Purpose**: Forces all traffic to use HTTPS
- **What happens**: `http://yoursite.com` → `https://yoursite.com`

## How It All Works Together

1. **User visits your site** → nginx receives the request
2. **nginx checks the URL**:
   - `/api/login` → Send to backend
   - `/avatars/user123.jpg` → Send to backend  
   - `/` or `/home` → Send to frontend
   - `/api/find-match` → Send to backend with WebSocket support
3. **Backend/Frontend responds** → nginx sends response back to user

This setup lets you have one domain but multiple services working together seamlessly!
