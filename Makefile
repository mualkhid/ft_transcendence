# Makefile for ft_transcendence project

# Directories to persist data
PERSIST_DIRS = persist/sqlite persist/avatars


COMPOSE = docker compose

all: up

# Create directories if they don't exist
init-dirs:
	@mkdir -p $(PERSIST_DIRS)
	
build: init-dirs
	$(COMPOSE) build

up: init-dirs
	$(COMPOSE) up --build -d

clean:
	$(COMPOSE) down -v --remove-orphans
	docker system prune -af --volumes

down:
	$(COMPOSE) down

restart: down up

logs:
	$(COMPOSE) logs -f

.PHONY: re
re: clean all