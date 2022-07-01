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
    - [ ] TODO more?
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

## Developer environment -- Docker way

Frontend needs to be built after every change, but the server auto-reloads(!).

First-time you will need: `docker-compose build`

### Setting up the server

`docker-compose up`

(before first run, you will need `npm run build`)

### Reload frontend manually

`npm run build`

...and reload page

## Developer environment -- without docker

Node v10 and NPM v6 is not enough! I do not know why exactly.

```
npm run build # build frontend -- auto-reload
npm dev:server # build server -- auto-reload
```

### If your Node is old

Ubuntu 20.04 package is too old, for example.

Install node, and set path.

1) Download node binary package for your OS: https://nodejs.org/en/download/

1) Uncompress to /opt/node

1) Prepend path in .bashrc:

  Write this line to your bashrc to set up path for terminal. (Windows guys, you need to look it up yourself):

  `export PATH=/opt/node/bin:"$PATH"`

1) `node --version` should return version of at least 16.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
