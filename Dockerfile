FROM node:latest

WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
COPY .npmrc /usr/src/app/

RUN npm ci --omit=dev

# Code will be mounted, i.e. synced to the container
# COPY . .

EXPOSE 8000

# dev:server -> live restart
CMD [ "npm", "run", "dev:server" ]