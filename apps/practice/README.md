# durer-jatekok

Code for the online, client-side versions of past strategy games at the Dürer Math Competition.

The deployed version is here: https://a-gondolkodas-orome.github.io/durer-jatekok/.

# Development

Feel free to commit directly to the default (master) branch. If in doubt, send a pull request instead.

When you push to the default (master) branch, the tests are run, and if they are successful, the project is deployed to the live website within a few minutes.

## Adding a new game

To keep track of who works on which game, use [this table](https://docs.google.com/spreadsheets/d/1-6u9PCtvf_gDHrs65x36pmDzFt4nZZx_IUuXrgS2aZk/edit#gid=0).

TL;DR;

1. Create a react component for the game under `src/components/games`.
2. Add the game component to the router in `src/components/app/app.js`.
3. Add the game metadata to `src/components/games/gameList.js`.

*For more information, see Section [How to Develop](#how-to-develop)*

## Project setup

- install Node.js on your computer globally (or use nvm)
- in the project directory terminal run `npm ci`

## Useful npm commands

### Compiles and hot-reloads for development

```bash
npm run dev
```

Known issue: sometimes weird bugs happen with parcel caching (i.e. the app does not start at all with `npm run dev:withcache`) which disappear if you delete the `.parcel-cache`
directory manually and re-load. Therefore `npm run dev` uses the slightly slower but more robust dev server without caching.

If you are using Windows and you see `Error: The specified module could not be found. ... code: 'ERR_DLOPEN_FAILED'`
https://github.com/parcel-bundler/parcel/issues/7104#issuecomment-967260755 might help you.

### Run tests

```bash
npm run test # lint and tests (as GA)
```

Simple formatting errors such as trailing spaces can be automatically fixed with
```bash
npm run lint:fix
```

### Build for prod

(some problems only appear in prod build, not while testing, for example using a variable without declaring it)

```bash
npm run build
```

## IDE setup

Recommended VS Code extensions:

- [Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Tailwind Css](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

# How to develop

_WIP, substantial refactor in progress!_

This project uses the React frontend "framework", the [official tutorial](https://react.dev/learn) is a good starting point.

The common parts of all games (showing rules, alternating turns, buttons for choosing a role, restart game) are extracted
to a `strategyGameFactory` which is highly recommended (but not a must). The below documentation is about creating a new game
with this factory (so that you can focus on game logic and designing the board interactions.)

If you need a new, common parameter, you can create it and pass it down from `strategyGameFactory`.

## Must have for a new game

*It is recommended to copy and modify an existing, similar game.*

BoardClient: a React component with `board`, `ctx` `events` and `moves` props which calls `events.endTurn`,
typically following a click from the user. Typically the user clicks, new state is calculated within
the BoardClient component and then as a final step `events.endTurn` is called possibly followed by `events.endGame()`, wrapped in an appropriate move function.

Concept: `board` holds the state necessary to know the game state, specific to each game, that the next player
needs to know. Common state, managed by the framework is stored in `ctx` such as `chosenRoleIndex`. Additional state variables may be created within the `BoardClient` component
that is relevant only during a turn, not between turns, such as reacting to hover events.

A `move` is a unit that captures a change in the board initiated by a player. Moves help
ensure that the game is played according to rules by all players.

Each move must return an object with nextBoard, the framework will call setBoard(nextBoard).
In the Ai strategy due to the possible case of multiple moves one must provide board param to moves yourself.

```js
// `ctx` is an object and will contain the following (extendable):
// - `shouldRoleSelectorMoveNext: boolean
// - chosenRoleIndex: null/0/1 (the role that the player chooses at the beginning)
// - turnStage: in game with multi-stage turns you may use this param to track to stage
//     if you need it in common parts such as step description as well
// `events` is and objects that will contain the following (extendable):
// - endTurn: a function, see below
// - endGame
// - setTurnStage
const BoardClient = ({ board, ctx, events, moves }) => {
  const click = () => {
    // const nextBoard = ...
    events.endTurn();
    // optionally
    // events.endGame();
    return { nextBoard };
  }
  return (
    <section className="p-2 shrink-0 grow basis-2/3">   
        <button
          onClick={click}
        ></button>
    </section>
  );
};
```

```js
// React component for the whole game which should be added to router
export const HunyadiAndTheJanissaries = strategyGameFactory({
  // a React component (can be text in <></>)
  rule,
  // a short string
  title: 'Hunyadi és a janicsárok',
  BoardClient,
  // a function returning a string, receives { board, ctx: { chosenRoleIndex, turnStage, ... } }
  getPlayerStepDescription,
  // a function returning a new, possibly random starting board object
  generateStartBoard,
  // TODO: deprecated, a function with `{ board, ctx, events, moves }` parameter returning `{ nextBoard, isGameEnd, winnerIndex }`
  getGameStateAfterAiTurn,
  // TODO: an object with functions. TBD
  moves,
  // TODO: TBD, new alternative of getGameStateAfterAiTurn
  aiBotStrategy
});
```

### Game end, determining winner

`events.endGame({ winnerIndex })` or if the winner can be determined from who moved last before the game ended,
no need to specify winnerIndex.

## Things to look out for

- are the starting positions representative of the game complexity?
- can the player win with a not-winning strategy?
- is the game (mostly) mobile-friendly?
- is the game usable only with keyboard (without a mouse)?
- is it clear what the player should do next?
- can the player undo their last interaction in turns with multiple stages?
- is it easy to guess the winning strategy from wathing the AI play?
- do not allow the player interacting with the game while the other player's step is in progress, use `ctx.shouldRoleSelectorMoveNext`
- never modify react state (e.g. the board) in place
- check for console errors/warnings as well, i.e. missing keys on react components
- pretend AI is thinking in turns with multiple moves (for one move it is handled by framework)

## Technologies used

- Node.js for the development server and building the application
- React frontend framework ([official tutorial](https://react.dev/learn) is a good starting point)
- [optional] Tailwindcss for styling with utility classes
- [optional] jest for unit testing
- github actions for CI/CD.
- github pages as hosting
- [goatcounter](https://agondolkodasorome.goatcounter.com/) as usage tracker (Ildi has access)
