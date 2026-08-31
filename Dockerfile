# syntax=docker/dockerfile:1.26.0
# `COPY --parents` below is stable only from Dockerfile frontend 1.20 on, and
# Docker Desktop ships an older one for a good while after a release. Naming
# the frontend here makes BuildKit fetch it, so the build does not depend on
# how recent the daemon's built-in version happens to be.

FROM node:24.20.0

WORKDIR /usr/src/app

# Copy dependency metadata first (root + all workspaces)
COPY package.json package-lock.json turbo.json .npmrc ./
COPY --parents apps/*/package.json packages/*/package.json ./

# Install deps (cached unless package*.json or .npmrc change)
RUN npm ci

# Copy source code
COPY . .

RUN npx turbo build --filter=online-backend

EXPOSE 8000

# Run the server that was just built. docker-compose.dev.yml overrides this with
# the watching dev server for local development.
CMD [ "npm", "run", "start", "--workspace=online-backend" ]
