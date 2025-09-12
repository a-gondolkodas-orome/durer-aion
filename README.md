# Durer Online Round framework

Real-time multiplayer framework for online math competitions with interactive games, built on top of boardgame.io.

## Demos

An offline version of the 2023 framework is available [here](https://a-gondolkodas-orome.github.io/durer-jatekok-new/)

An offline version of previous relay games is available [here](https://a-gondolkodas-orome.github.io/durer-aion/)

Strategy games are available [here](https://a-gondolkodas-orome.github.io/durer-jatekok/) (this one is based on [another framework](https://github.com/a-gondolkodas-orome/durer-jatekok))

All demos are in Hungarian.

# Getting Started

## Requirements

- [Node.js](https://nodejs.org/) version 19 or above (which can be checked by running `node -v`).
- [Docker](https://www.docker.com/)

## Installation

```
npm ci
```

## Running developer environment -- Docker way

Frontend needs to be built after every change, but the server auto-reloads.

### Setting up the server

```bash
sudo docker compose --env-file=.env.docker up --build 
```

 vagy 
 
```bash
docker compose --env-file=.env.docker up --build 
```

(before first run, you will need `npm run build`)
Also pay attention to create a correct `.env.docker` file based on the `.env.docker.sample` file.

Note: Some newer docker installs have a different compose interface, you may use the compose command like this:

```bash
sudo docker compose up --build
```

> Note: 
> To use this newer docker compose interface please follow the install instructions form the official docker install page: [ linux docker install](https://docs.docker.com/desktop/setup/install/linux/)  
> 
> Otherwise you may use this syntax:  
> ```bash
> docker-compose up --build
> ```

You should be up and running the application on `localhost`.

### Importing teams

```bash
docker exec -t durer-aion_backend_1 ./import_teams.sh ./test.tsv
```

### Reload frontend manually

```
npm run build
```

...and reload page

### Backend reloads automatically

:)

Except routing, and KOA hooks.
If you install a package used by the backend, you will have to `docker-compose build`.

## Running developer environment -- without docker (except DB)

> IMPORTANT!
> 
> The development enviroment uses a different connection setup to the database, so the .env files are different. 
> Pay attention to use the .env.local file for development!

Both frontend and server auto-reloads.

- Set up the database (in Windows you can run it without sudo):

```bash
sudo docker run -it --rm -e POSTGRESQL_PASSWORD=postgres -p 127.0.0.1:5432:5432 bitnami/postgresql
```


- After that you should import teams.

On linux/unix
```bash
./import_teams.sh test.tsv
```
On Windows
```powershell
.\import_teams.ps1 test.tsv
```


- You should create an `.env` file (see `.env.sample`).

- Run the following two commands in two separate terminal:

```bash
npm run dev:server
```
> This starts the backend with the earlier started db. Changing the code of server it auto-reloads itself.
```bash
npx react-scripts start
```
> This starts the frontend. Changing the code of frontend it auto-reloads itself. Note: you can use the backend without the frontend.

You should be up and running the application on `localhost:3000`.

### Debugging
VS code gives you two options to debug the application. Both of them needs some setup first, and they can't be used at the same time.

Breakpoints work either on the server, or on the frontend, but not on both at the same time. See different debugging options for further references.

#### Debugging server

If you want to debug the server then instead of running `npm run dev:server` go to `Run and Debug` menu in VSCode and select `Node.JS... -> Run Script: dev:server`

![image](https://github.com/a-gondolkodas-orome/durer-aion/assets/22480910/20fcba7b-148b-41c4-988d-83f9174708f5)


#### Debugging Frontend

If you want to use the Debugger to debug frontend code, you can use the `Debug Frontend` option.
In this case, you still have to start the frontend, and the backend manually.


## How to create a new game

1) Copy 4 files (board, game, main, strategy) to a new directory in `src/games/`.
1) Add game in `index.tsx` (frontend-only code)
1) Add game in `lobby.tsx` (client-side code)
1) Add game in `server.tsx` (server-side code)
