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
	docker exec -it $(VAULT_CONTAINER) vault operator init || true

vault-unseal:
	@if [ -z "$(KEY)" ]; then exit 1; fi
	docker exec -it $(VAULT_CONTAINER) vault operator unseal $(KEY) || true

vault-login:
	@if [ -z "$(TOKEN)" ]; then exit 1; fi
	docker exec -it $(VAULT_CONTAINER) vault login $(TOKEN) || true

vault-put:
	@if [ -z "$(PATH)" ] || [ -z "$(VALUE)" ]; then exit 1; fi
	docker exec -it $(VAULT_CONTAINER) vault kv put $(PATH) value=$(VALUE) || true

vault-get:
	@if [ -z "$(PATH)" ]; then exit 1; fi
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

.PHONY: re
re: clean all
