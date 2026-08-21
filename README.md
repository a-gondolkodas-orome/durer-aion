# Durer Online Round framework

Real-time multiplayer framework for online math competitions with interactive games, built on top of boardgame.io.

## Demos

An offline version of the 2023 framework is available [here](https://a-gondolkodas-orome.github.io/durer-jatekok-new/)

An offline version of previous relay games is available [here](https://gyakorlo.durerinfo.hu/valto/)

Strategy games are available [here](https://gyakorlo.durerinfo.hu/jatekok/)

All demos are in Hungarian.

# Getting Started

## Requirements

- [Node.js](https://nodejs.org/) — the version in [`.nvmrc`](./.nvmrc) (Node 24), which is what CI and the Docker image run. With [nvm](https://github.com/nvm-sh/nvm) installed, `nvm use` in the repo root picks it up. Older versions may still work; `npm` will warn rather than stop you.
- [Docker](https://www.docker.com/)

## Installation

```
npm ci
```

## The practice site (`apps/strategy-practice`)

The strategy-game practice site (https://gyakorlo.durerinfo.hu) lives in
`apps/strategy-practice`, merged in from the durer-jatekok repository with its
history and renamed from `apps/practice` when the relay practice app arrived
(pre-rename history: `git log -- apps/practice`). It is a workspace: one root
`npm ci` installs it, and its own checks run from its directory:

```bash
cd apps/strategy-practice
npm run dev     # the practice site
npm test        # its own lint + typecheck + unit tests
```

Root commands (`npm ci`, `npm run lint`, `npm test`, `npm run build`,
`npm run typecheck`) deliberately skip it — it has its own toolchain, its own
lockfile and its own eslint config until the workspaces are unified.

## Running offline-frontend

Create the `apps/offline-frontend/.env` file by copying the `.env.sample` in that folder. Then run:

```
npm run dev:offline
```

Offline frontend reloads automatically (except if you change `.env` file), but does not have a debugger yet.

## Running developer environment -- Docker way

Frontend needs to be built after every change, but the server auto-reloads.

### Setting up the server

```bash
sudo docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file=.env.docker up --build 
```

 vagy 
 
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file=.env.docker up --build 
```

The `-f docker-compose.dev.yml` overlay is what makes the backend auto-reload: it mounts the backend and package sources and swaps the container's command for `npm run dev:server`. Without it you get the production stack described below, which serves the code baked into the image.

(before first run, you will need `npm run build`)
Also pay attention to create a correct `.env.docker` file based on the `.env.docker.sample` file.

> Note: 
> To use this newer docker compose interface please follow the install instructions form the official docker install page: [ linux docker install](https://docs.docker.com/desktop/setup/install/linux/)  
> 
> Otherwise you may use this syntax:  
> ```bash
> docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
> ```

You should be up and running the application on `localhost`.

### Importing teams

```bash
docker exec -t durer-aion-backend-1 ./scripts/import_teams.sh ./scripts/test.tsv
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

## Running the production stack

This is what a deployed instance runs (see `DEPLOYMENT.md`):

```bash
npm run build                              # builds the frontend into apps/online-frontend/dist
docker compose --env-file=.env.docker up --build
```

No `-f` overlay, so the backend container runs the server compiled into the
image (`npm run start --workspace=online-backend`) rather than a file watcher.
Code changes need a rebuild; nginx serves the frontend from
`apps/online-frontend/dist` on the host, so a frontend change needs
`npm run build` and a page reload, same as in the dev flow.

## Running developer environment -- without docker (except DB)

Both frontend and server auto-reloads.

- Set up the database (in Windows you can run it without sudo):

```bash
sudo docker run -it --rm -e POSTGRESQL_PASSWORD=postgres -p 127.0.0.1:5432:5432 bitnami/postgresql
```
- After that you should import teams.

```bash
./scripts/import_teams.sh scripts/test.tsv # On linux/unix
.\scripts\import_teams.ps1 scripts\test.tsv # On Windows
```

- Create the `apps/online-backend/.env` file. (see `.env.sample` in that folder)

- Run the following two commands in two separate terminal:

```bash
npm run dev:server
```
> This starts the backend with the earlier started db. Changing the code of server it auto-reloads itself.
```bash
npm run dev:online
```
> This starts the frontend. Changing the code of frontend it auto-reloads itself. Note: you can use the backend without the frontend.

You should be up and running the application on `localhost:5173`.

### Debugging (TODO)
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
