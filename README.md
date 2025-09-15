# Powerpuff Girls Pong - Docker-First Project

A modern Pong game with AI, multiplayer, and tournament features, designed to run entirely in Docker containers.

## 🐳 Docker-First Approach

This project is designed to run entirely in Docker containers for maximum consistency and production readiness. All development and production operations use Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Make utility (optional, for convenience commands)

### Start the Application
```bash
# Start all services
make up

# Or manually with docker-compose
docker-compose up --build -d
```

### Check Status
```bash
# View service status
make status

# View logs
make logs
```

## 📋 Available Commands

### Basic Operations
- `make up` - Start all services (default)
- `make down` - Stop all services
- `make restart` - Restart all services
- `make status` - Check service status

### Development
- `make up-logs` - Start services with visible logs
- `make logs-backend` - View backend logs only
- `make logs-frontend` - View frontend logs only
- `make logs-nginx` - View nginx logs only

### Container Management
- `make backend-shell` - Open shell in backend container
- `make frontend-shell` - Open shell in frontend container
- `make backend-install` - Install backend dependencies
- `make frontend-install` - Install frontend dependencies

### Database
- `make migrate` - Run database migrations
- `make generate` - Generate Prisma client

### Maintenance
- `make clean` - Clean up all Docker resources
- `make re` - Rebuild everything from scratch

## 🏗️ Architecture

### Services
- **nginx**: SSL termination and reverse proxy
- **backend**: Node.js API server with Prisma ORM
- **frontend**: TypeScript/HTML5 game client

### Data Persistence
- SQLite database in `./persist/sqlite/`
- User avatars in `./persist/avatars/`

## 🔧 Development

### Running Commands in Containers
```bash
# Access backend container
make backend-shell

# Access frontend container
make frontend-shell

# Install dependencies (if needed)
make backend-install
make frontend-install
```

### Database Operations
```bash
# Run migrations
make migrate

# Generate Prisma client
make generate

# Access database directly
make backend-shell
npx prisma studio
```

## 🌐 Access Points

- **Game**: https://localhost (or your HOST_IP)
- **API Docs**: https://localhost/docs
- **Database Studio**: Run `make backend-shell` then `npx prisma studio`

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Check status
make status

# View logs
make logs

# Restart services
make restart
```

### Dependencies Issues
```bash
# Rebuild containers
make re

# Or install dependencies manually
make backend-install
make frontend-install
```

### Database Issues
```bash
# Reset database
make clean
make up

# Or run migrations manually
make migrate
```

## 📁 Project Structure

```
├── backend/           # Node.js API server
│   ├── Dockerfile     # Backend container config
│   ├── package.json   # Backend dependencies
│   └── ...
├── frontend/          # Game client
│   ├── Dockerfile     # Frontend container config
│   ├── package.json   # Frontend dependencies
│   └── ...
├── security/          # Nginx SSL configuration
│   └── Dockerfile     # Nginx container config
├── persist/           # Data persistence
│   ├── sqlite/        # Database files
│   └── avatars/       # User avatars
├── docker-compose.yml # Service orchestration
├── Makefile          # Convenience commands
└── README.md         # This file
```

## 🔒 Security

- SSL/TLS encryption via nginx
- JWT-based authentication
- Input validation and sanitization
- Rate limiting and CORS protection

## 🎮 Game Features

- **AI Games**: Play against computer opponents
- **Local Games**: 1v1 on same device
- **Multiplayer**: Online matches with other players
- **Tournaments**: Competitive tournament system
- **Statistics**: Comprehensive game analytics
- **Achievements**: Progress tracking system

## 📊 Monitoring

```bash
# View all logs
make logs

# View specific service logs
make logs-backend
make logs-frontend
make logs-nginx

# Check service health
make status
```

## 🚀 Production Deployment

The Docker setup is production-ready with:
- Non-root user execution
- Proper volume mounting
- Health checks
- Restart policies
- SSL termination
- Resource optimization

## 📝 Notes

- All operations should be done through Docker
- Never run `npm install` on the host machine
- Use `make` commands for convenience
- Check `docker-compose.yml` for service configuration
- Environment variables are set in `.env` files
