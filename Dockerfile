FROM node:24

WORKDIR /usr/src/app

# Copy dependency metadata first (root + all workspaces)
COPY package.json package-lock.json turbo.json .npmrc ./
COPY --parents apps/*/package.json packages/*/package.json ./

# Install deps (cached unless package*.json or .npmrc change)
RUN npm ci

# Copy source code
COPY . .

# Initial build needed: dev mode (tsc --watch + nodemon) expects dist/ to already exist
RUN npx turbo build --filter=online-backend

EXPOSE 8000

# dev:server -> live restart
CMD [ "npm", "run", "dev:server" ]
