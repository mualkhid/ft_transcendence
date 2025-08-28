# Makefile for ft_transcendence project

COMPOSE = docker compose
VAULT_CONTAINER = ft_transcendence-vault-1

all: backend-install build up vault-init vault-unseal vault-login vault-put vault-get

backend-install:
	cd backend && npm install

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up --build -d

vault-init:
	$(COMPOSE) up -d vault
	@echo "\n--- Vault Initialization ---"
	docker exec -it $(VAULT_CONTAINER) vault operator init || true

vault-unseal:
	@echo "\n--- Vault Unseal ---"
	@echo "Usage: make vault-unseal KEY=<unseal_key> (run 3 times with different keys)"
	@if [ -z "$(KEY)" ]; then echo "Please provide KEY=<unseal_key>"; exit 1; fi
	docker exec -it $(VAULT_CONTAINER) vault operator unseal $(KEY) || true

vault-login:
	@echo "\n--- Vault Login ---"
	@echo "Usage: make vault-login TOKEN=<root_token>"
	@if [ -z "$(TOKEN)" ]; then echo "Please provide TOKEN=<root_token>"; exit 1; fi
	docker exec -it $(VAULT_CONTAINER) vault login $(TOKEN) || true

vault-put:
	@echo "\n--- Vault Put Secret ---"
	@echo "Usage: make vault-put PATH=secret/hello VALUE=world"
	@if [ -z "$(PATH)" ] || [ -z "$(VALUE)" ]; then echo "Please provide PATH and VALUE"; exit 1; fi
	docker exec -it $(VAULT_CONTAINER) vault kv put $(PATH) value=$(VALUE) || true

vault-get:
	@echo "\n--- Vault Get Secret ---"
	@echo "Usage: make vault-get PATH=secret/hello"
	@if [ -z "$(PATH)" ]; then echo "Please provide PATH"; exit 1; fi
	docker exec -it $(VAULT_CONTAINER) vault kv get $(PATH) || true

clean:
	$(COMPOSE) down -v --remove-orphans
	docker system prune -af --volumes

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) down
	$(COMPOSE) up --build -d

logs:
	$(COMPOSE) logs -f
