FROM node:24.19.0

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
