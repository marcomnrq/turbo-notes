# justfile — convenience recipes for Turbo Notes.
#
# Two ways to run the app:
#   • `just dev`    — host-local dev servers in parallel (fast HMR; needs
#                     backend/.venv and frontend/node_modules). The two app
#                     servers only — bring up Postgres yourself or let
#                     settings.py fall back to SQLite.
#   • `just up`     — full stack in Docker (db + backend + frontend).
#
# Install `just` (https://github.com/casey/just): `brew install just`.
# List every recipe with comments: `just --list`.

# Default recipe: show available commands.
default:
    @just --list

# ── Host-local dev (parallel app servers, no Docker) ────────────────────────

# Run backend (runserver) + frontend (next dev) in parallel with labeled output.
# Ctrl-C stops both. Requires root deps: `npm install`.
dev:
    npm run dev

# Run only the backend dev server on the host (uses backend/.venv).
dev-backend:
    npm run dev:backend

# Run only the frontend dev server on the host.
dev-frontend:
    npm run dev:frontend

# Install root tooling (concurrently). Run once after cloning.
install:
    npm install

# ── Docker dev (full stack via docker-compose) ──────────────────────────────

# Build (or rebuild) all service images.
build:
    docker compose build

# Start the full stack, (re)building images first. (alias: `just run`)
up run:
    docker compose up --build

# Start in the background.
up-detached:
    docker compose up --build -d

# Stop and remove containers (networks/volumes are kept unless you add `-v`).
down:
    docker compose down

# Stop running containers without removing them.
stop:
    docker compose stop

# Tail logs from all services (or one: `just logs backend`).
logs service='':
    docker compose logs -f {{service}}

# Show the status of all services.
ps:
    docker compose ps

# ── Database migrations ─────────────────────────────────────────────────────
# Migrations are an explicit step — never run on server boot.

# Apply pending migrations (Docker).
migrate:
    docker compose run --rm backend python manage.py migrate

# Apply pending migrations on the host (uses backend/.venv).
migrate-local:
    cd backend && ./.venv/bin/python manage.py migrate

# Generate migrations from model changes (Docker).
makemigrations:
    docker compose run --rm backend python manage.py makemigrations

# Generate migrations from model changes on the host.
makemigrations-local:
    cd backend && ./.venv/bin/python manage.py makemigrations

# Fail if model changes aren't reflected in committed migrations.
# Run in CI / before deploy to catch "forgot to commit the migration".
migrate-check:
    docker compose run --rm backend python manage.py makemigrations --check --dry-run

# Open a Django shell in the backend container.
shell-backend:
    docker compose run --rm backend python manage.py shell

# Run the full test suite (backend pytest, then frontend vitest).
test: test-backend test-frontend

# Run the backend pytest suite.
test-backend:
    docker compose run --rm backend pytest

# Run the frontend vitest suite (no backend/db needed).
test-frontend:
    docker compose run --rm --no-deps frontend npm test

# Run all linters (backend ruff, then frontend biome).
lint: lint-backend lint-frontend

# Lint the backend with ruff.
lint-backend:
    docker compose run --rm backend ruff check .

# Lint the frontend with biome (`npm run lint`).
lint-frontend:
    docker compose run --rm --no-deps frontend npm run lint
