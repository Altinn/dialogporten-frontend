typecheck: ## Runs `pnpm turbo typecheck`
	pnpm turbo typecheck

lint: ## Runs `pnpm turbo lint`
	pnpm turbo lint

test: ## Runs `pndpm turbo test`
	pnpm turbo test

build: ## Runs `pnpm turbo build`
	pnpm turbo build 

build-docker: ## Runs `pnpm turbo build:docker`
	pnpm turbo build:docker

dev: ## Runs Docker compose in watch mode for development
	docker compose watch	

compose-down: ## Runs `docker compose down`
	docker compose down

compose-clean: ## Stops containers and removes dangling images
	docker compose down
	docker image prune -f

compose-deep-clean: ## Full cleanup: stops containers, removes volumes and all unused images
	docker compose down -v
	docker system prune -af --volumes

pull: ## Pulls and stores images locally and builds project
	docker compose pull && docker pull node:22-slim && docker compose build

# ---------------------
# - Helper functions  -
# ---------------------

.PHONY: help select dev
.DEFAULT_GOAL := select

select:
	@make help | sed '1,2d' | \
		fzf --ansi --bind "enter:execute(make {1} < /dev/tty > /dev/tty 2>&1)+abort" || true

# Help command taken from: https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help:
	@echo "Usage: make [task]\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\x1b[0m %s\n", $$1, $$2}'
