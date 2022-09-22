FROM node:latest

WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
COPY .npmrc /usr/src/app/

# Dev dependencies contain react -> breaks our install
RUN npm ci --include=dev
COPY boardgame.io/package*.json /usr/src/app/boardgame.io/
RUN (cd /usr/src/app/boardgame.io && npm ci --include=dev)

# Code will be mounted, i.e. synced to the container
COPY . .

RUN (cd /usr/src/app/boardgame.io && npm run clean && npm run build && npm run prepack)

EXPOSE 8000

# dev:server -> live restart
CMD [ "npm", "run", "dev:server" ]