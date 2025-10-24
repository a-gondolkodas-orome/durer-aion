FROM node:24

WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
COPY turbo.json /usr/src/app/
COPY .npmrc /usr/src/app/
COPY . .

RUN npm ci

EXPOSE 8000

# dev:server -> live restart
CMD [ "npm", "run", "dev:server" ]