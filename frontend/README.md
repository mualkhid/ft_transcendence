# Powerpuff Girls Pong 🎮

A fun Pong game themed around the Powerpuff Girls, built with **pure TypeScript and Tailwind CSS**.

## 🚀 Quick Start with Docker

### Option 1: Docker Compose (Recommended)
```bash
# Build and start the game
npm run start

# Or manually:
npm run build
npm run docker:compose
```

### Option 2: Docker Commands
```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

### Option 3: Manual Docker
```bash
# Build image
docker build -t powerpuff-pong .

# Run container
docker run -p 8080:80 powerpuff-pong
```

## 🌐 Access the Game
Open your browser and go to: **http://localhost:8080**

## 🎮 Game Controls
- **Player 1 (Blossom - Pink)**: W/S keys to move paddle up/down
- **Player 2 (Bubbles - Blue)**: Up/Down arrow keys to move paddle up/down
- **Power-ups**: Press Space bar to activate power-ups

## 🛠️ Development

### Prerequisites
- Docker
- Node.js & npm

### Build Process
```bash
# Install dependencies
npm install

# Build TypeScript and Tailwind CSS
npm run build

# Start with Docker
npm run docker:compose
```

### Development Mode
```bash
# Watch for changes
npm run dev

# In another terminal, start Docker
npm run docker:compose
```

## 🐳 Docker Commands

```bash
# Start the game
npm run docker:compose

# Stop the game
npm run docker:stop

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

## 📁 Project Structure
```
ft_transcendence/
├── src/
│   ├── main.ts         # Game logic (TypeScript)
│   └── input.css       # Tailwind CSS input
├── dist/               # Built files (generated)
├── avatars/            # Character avatars
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose config
├── nginx.conf          # Nginx configuration
└── package.json        # Dependencies and scripts
```

## ✨ Features
- **Pure TypeScript**: No frameworks, just vanilla TypeScript
- **Tailwind CSS**: Modern utility-first styling
- **Docker Ready**: Easy deployment and portability
- **Powerpuff Girls Theme**: Pink vs Blue paddles with power-ups
- **Responsive Design**: Works on different screen sizes

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8080
lsof -i :8080

# Kill the process or use a different port
docker run -p 8081:80 powerpuff-pong
```

### Rebuild Docker Image
```bash
docker-compose down
docker-compose up --build -d
```

## 📝 License
MIT License - Feel free to modify and distribute! 