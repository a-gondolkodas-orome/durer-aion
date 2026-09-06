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

# .dockerignore keeps credentials and team lists out of the context; this fails
# the build if one of those patterns ever stops matching. Docker matches a
# pattern against the whole path, so the `**/` prefixes are load-bearing and
# easy to drop by accident — that is how apps/online-backend/.env used to get
# baked in (#443). CI seeds the env files before building, so a regression
# surfaces in the docker job rather than in a deployed image. node_modules is
# pruned because npm ci has already filled it above.
RUN leaked=$(find . -name node_modules -prune -o \( -name '.env*' -o -name '*.tsv' \) -print); \
    if [ -n "$leaked" ]; then \
      echo "These must not reach the image — check .dockerignore:" >&2; \
      echo "$leaked" >&2; \
      exit 1; \
    fi

RUN npx turbo build --filter=online-backend

EXPOSE 8000

# Run the server that was just built. docker-compose.dev.yml overrides this with
# the watching dev server for local development.
CMD [ "npm", "run", "start", "--workspace=online-backend" ]
