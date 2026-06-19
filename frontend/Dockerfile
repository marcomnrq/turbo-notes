# Multi-stage Dockerfile for the Turbo Notes frontend.
# Dev-focused: the runtime stage runs `next dev` with HMR, paired with the
# bind-mount and anonymous /app/node_modules + /app/.next volumes in
# docker-compose.yml.

# ---- deps: install node_modules (layer-cached) ----
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: lean image with deps + source ----
FROM node:22-alpine AS dev

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

# Bind to all interfaces so the published port is reachable.
# HMR works through the bind-mount; --turbopack is Next 16's default dev engine.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
