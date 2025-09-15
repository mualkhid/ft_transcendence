# Makefile for ft_transcendence project
# Docker-first approach - all operations use Docker

# Directories to persist data
PERSIST_DIRS = persist/sqlite persist/avatars
GET_IP := $(shell node get_ip.js 2>/dev/null || echo 'localhost')

# Default target - always use Docker
all: up

# Initialize required directories
init-dirs:
	@mkdir -p $(PERSIST_DIRS)
	@echo "✅ Directories initialized for Docker volumes"

# Build Docker images
build: init-dirs
	@echo "🐳 Building Docker images with IP: $(GET_IP)"
	HOST_IP=$(GET_IP) docker-compose build 

# Start all services with Docker
up: init-dirs
	@echo "🚀 Starting all services with Docker"
	HOST_IP=$(GET_IP) docker-compose up --build -d
	@echo "✅ Services started! Check status with 'make status'"

# Start services in foreground (for debugging)
up-logs: init-dirs
	@echo "🐳 Starting services with logs visible"
	HOST_IP=$(GET_IP) docker-compose up --build

# Check service status
status:
	@echo "📊 Docker services status:"
	docker-compose ps

# View logs
logs:
	@echo "📋 Showing logs (Ctrl+C to exit):"
	docker-compose logs -f

# View backend logs only
logs-backend:
	docker-compose logs -f backend

# View frontend logs only
logs-frontend:
	docker-compose logs -f frontend

# View nginx logs only
logs-nginx:
	docker-compose logs -f nginx

# Stop all services
down:
	@echo "🛑 Stopping all services"
	HOST_IP=localhost docker-compose down

# Restart all services
restart: down up

# Clean everything (including volumes)
clean:
	@echo "🧹 Cleaning up Docker resources"
	HOST_IP=localhost docker-compose down -v --remove-orphans
	docker system prune -af --volumes
	@echo "✅ Cleanup complete"

# Rebuild everything from scratch
re: clean localhost

# Development mode with localhost
localhost: init-dirs
	@echo "🏠 Building and starting with localhost"
	HOST_IP=localhost docker-compose build --no-cache
	HOST_IP=localhost docker-compose up -d

# Execute commands in backend container
backend-shell:
	@echo "🐚 Opening shell in backend container"
	docker-compose exec backend /bin/sh

# Execute commands in frontend container
frontend-shell:
	@echo "🐚 Opening shell in frontend container"
	docker-compose exec frontend /bin/sh

# Install dependencies in backend (if needed)
backend-install:
	@echo "📦 Installing backend dependencies"
	docker-compose exec backend npm install

# Install dependencies in frontend (if needed)
frontend-install:
	@echo "📦 Installing frontend dependencies"
	docker-compose exec frontend npm install

# Run database migrations
migrate:
	@echo "🗄️ Running database migrations"
	docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
generate:
	@echo "🔧 Generating Prisma client"
	docker-compose exec backend npx prisma generate

.PHONY: all init-dirs build up up-logs status logs logs-backend logs-frontend logs-nginx down restart clean re localhost backend-shell frontend-shell backend-install frontend-install migrate generate