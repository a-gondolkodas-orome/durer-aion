# Durer jatekok new -- Project scope

Boardgame IO abstracts different scenarios we were trying by implement.

- Practice, for fun: [](https://github.com/a-gondolkodas-orome/durer-jatekok)
- Practice, 2 players against each other (same machine or two machines are both possible)
- Live contest: three contestants playing the game without a bot (this is not important use-case)
- Live contest: three contestants play the game 1) with the easy bot 2) with the live bot. (These should be logged of course.)

Boardgame IO supports all three, with some quirks (one has to implement choosing live/test game, choosing first player, scoring, timers, etc.) These can be achieved using `Phases`, etc.

Generalizing these into a single code base would make everything.

## Out-of-Scope

- Design (:

## Complex issues found so far

- Lobby/Server are huge components, maybe we can cut some things out of them.
  - Lobby:
- Architectural: what are gameserver vs apiserver?

## Roadmap (alkoto tabor)

- [ ] Implement full live contest mechanics (scoring, timers, etc. not architectural!)
  - [ ] Scoring
  - [ ] Timers
  - [ ] live/test
  - [ ] chooseRole
  - [ ] Generalize it: goal is to **ease the life of game developers**.
- [ ] Higher level live contest mechanics
  - [ ] Live score (scoreboard)
    - Architecturally: if horizontally scaling, sync will be important
  - [ ] Choose match, connect to it, start timer(?)
  - [ ] Some form of authentication
- [ ] Create architecture for full live contest (Scalability, DB access, logging every meaningful action)
  - Scaling can be implemented by sw equivalent of sharding, i.e. creating multiple contest sites, where a) every service has DB access b) every service can access a common scoreboard, etc. service
  - Create DB
  - Deploy system (CI/CD?)

- [x] Create server-client-core code-structure?
  - [x] Understand how code is distributed in BoardGame.IO and copy that structure.
    - It uses Rollup to create 3 distributions from the same tree (importable package, browser version, server version)

- [ ] Relay contest: Game+Board
  - [ ] Images

- [ ] Administrator view:
  - [ ] Monitoring: API health (Prometheus)
  - [ ] Modify game state of a user
    - [ ] Add time / set time-out date
    - [ ] Reset state
    - [ ] View user's game
    - [ ] TODO: more?
  - [ ] Reset user password?
  - [ ] Login link???
  - Contest configuration related:
    - [ ] Load users, which contest they need, etc.
    - [ ] Create matches (games users can connect to)
      - [ ] Auto-add bot
- [ ] User's view:
  - [ ] Authentication (login form??)
  - [ ] Single "Start" button instead of &lt;Lobby&gt;

## Details

Tasks:
- Rx7: Look at Auth package
- Adam: frontend for live contest system
- Adam: extract common code from live contest game logic

# Getting Started

## Requirements

- [Node.js](https://nodejs.org/) version 16 or above (which can be checked by running `node -v`).
- [Docker](https://www.docker.com/)

## Installation

`npm ci`

## Running developer environment -- Docker way

Frontend needs to be built after every change, but the server auto-reloads(!).

### Setting up the server

`docker-compose up --build`

(before first run, you will need `npm run build`)

You should be up and running the application on `localhost`.

### Importing teams

On linux/unix
```bash
./import_teams.sh test.tsv
```
On Windows
```powershell
.\import_teams.ps1 test.tsv
```

### Reload frontend manually

`npm run build`

...and reload page

### Backend reloads automatically

:)

Except routning, and KOA hooks. 
If you install a package used by the backend, you will have to `docker-compose build`.

## Running developer environment -- without docker (except DB)

Set up the database (in Windows you can run it without sudo):

```bash
sudo docker run -it --rm -e POSTGRESQL_PASSWORD=postgres -p 127.0.0.1:5432:5432 bitnami/postgresql
```

After that you should import teams (see above).

You should create an `.env.local` file (see `.env.local.sample`).

Run the following two commands in two seperate terminal:

```bash
npm run dev:server # build server -- auto-reload
```
> This starts the backend with the earlier started db.
```bash
npx react-scripts start # build frontend -- auto-reload
```
> This starts the frontend. Note: you can use the backend without the frontend.

You should be up and running the application on `localhost:3000`.

### Fixing Frontend -- Introduce proxy for CORS

Add proxy for frontend in `package.json`:

```json
  "proxy": "http://localhost:8000",
```

### Debugging
VS code gives you two options to debug the application. Both of them needs som setup first, an they can't be used at the same time.

Breakpoints work either on the server, or on the frontend, but not on both at the same time. See different debugging options for further references.

#### Debugging server

If you want to debug the server then instead of running `npm run dev:server` go to `Run and Debug` menu in VSCode and select `Node.JS... -> Run Script: dev:server`

![image](https://github.com/a-gondolkodas-orome/durer-aion/assets/22480910/20fcba7b-148b-41c4-988d-83f9174708f5)

Breakpoints work on the server, but not on the frontend.


#### Debugging Frontend

If you wan't to use the Debugger to debug frontend code, you can use the `Debug Frontend` option.
In this case, you still have to start the frontend, and the backend manually.


## How to create a new game

1) Copy 4 files (board, game, main, strategy) to a new directory in `src/games/`.
1) Add game in `index.tsx` (frontend-only code)
1) Add game in `lobby.tsx` (client-side code)
1) Add game in `server.tsx` (server-side code)


## If your Node is old

Node v10 and NPM v6 is not enough! I do not know why exactly.

Ubuntu 20.04 package is too old, for example.

Install node, and set path.

1) Download node binary package for your OS: https://nodejs.org/en/download/

1) Uncompress to /opt/node

1) Prepend path in .bashrc:

  Write this line to your bashrc to set up path for terminal. (Windows guys, you need to look it up yourself):

  `export PATH=/opt/node/bin:"$PATH"`

1) `node --version` should return version of at least 16.
