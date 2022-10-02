FROM node:latest

WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
COPY .npmrc /usr/src/app/

# Dev dependencies contain react -> breaks our install
RUN npm install
COPY boardgame.io/package*.json /usr/src/app/boardgame.io/
RUN (cd /usr/src/app/boardgame.io && npm ci --include=dev)

# Code will be mounted, i.e. synced to the container
COPY src src
COPY tsconfig.json tsconfig.json
COPY boardgame.io boardgame.io

RUN (cd /usr/src/app/boardgame.io && npm run prepack && npm ci --omit=dev)
RUN npm run build:server

EXPOSE 8000

# dev:server -> live restart
CMD [ "npm", "run", "prod:server" ]
