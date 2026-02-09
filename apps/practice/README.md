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

There is a (fairly minimal) devcontainer setup if you prefer that. Alternatively,
here are the installation instructions:

### Installing locally 

- install Node.js on your computer globally (or use nvm)
- in the project directory terminal run `npm ci`

## Useful npm commands

### Compiles and hot-reloads for development

```bash
npm run dev # use npm run dev:container within the devcontainer
```

### Run tests

```bash
npm run test # lint and tests (as Github Actions)
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

This project uses the React frontend "framework", the [official tutorial](https://react.dev/learn) is a good starting point.

The common parts of all games (showing rules, alternating turns, buttons for choosing a role, restart game) are extracted
to a `strategyGameFactory` which is highly recommended (but not a must). The below documentation is about creating a new game
with this factory (so that you can focus on game logic and designing the board interactions.)


*It is recommended to copy and modify an existing, similar game.*

## Minimal demonstrative example

```js
const moves = {
  addNumber: (board, { ctx, events }, number) => {
    const nextBoard = board + number;
    events.endTurn();
    if (nextBoard >= 20) {
      events.endGame({ winnerIndex: 1 - ctx.currentPlayer })
    }
    return { nextBoard }
  }
};

const BoardClient = ({ board, ctx, moves }) => {
  const clickNumber = (number) => {
    if (!ctx.shouldRoleSelectorMoveNext) return;
    moves.addNumber(board, number);
  };

  return <>
    <button onClick={() => clickNumber(1)}>1</button>
    <button onClick={() => clickNumber(2)}>2</button>
  </>
};

const aiBotStrategy = ({ board, moves }) => {
  const optimalStep = board % 3 === 0 ? 1 : (3 - board % 3)
  moves.addNumber(board, optimalStep);
};

// React component added to router in app.js
export const PlusOneTwo = strategyGameFactory({
  rule: <>0-ról +1/+2 20-ig</>,
  metadata: { name: '+1, +2' },
  BoardClient,
  // a function returning a string, receives optional { board, ctx }
  getPlayerStepDescription: () => 'Válaszd ki, hogy hánnyal növelsz.',
  generateStartBoard: () => 0,
  aiBotStrategy,
  moves
});
```

## Must have for a new game

### board object

Concept: `board` holds the state necessary to know the game state, specific to each game, that the next player
needs to know. It can be also convenient to store temporary state during a turn with multiple moves. Common state, managed by the framework is stored in `ctx` (such as `currentPlayer`).

Related factory param: `generateStartBoard`.

### possible game moves

Conceptually a `move` is a unit that captures a change in the board initiated by a player. Moves help
ensure that the game is played according to rules by all players.

Technically a move is a function whose first param is board, second param is `{ ctx, events }` and may
receive any number of additional params. The second param is provided by the framework, additional params will be provided by the client based on player interaction or by the bot strategy.
Each move must return an object with `nextBoard`, the framework will call `setBoard(nextBoard)`.

A move may result in ending the turn of the current player or ending the game or allow
further moves within the same turn.

Due to current implementation, you must always pass `board` as a first param to all moves (meaning updated board to subsequent moves in case of multiple moves within a turn).

### BoardClient React component

`BoardClient`: a React component which renders the board and calls appropriate move functions triggered by user interaction.

Props passed by framework:

- `board` (result of last move),
- `ctx`, (i.e. to know whose turn it is )
- `events` (i.e. to `setTurnStage`) and
- `moves`

Additional state variables may be created within the `BoardClient` component
that is relevant only during a turn, not between turns, such as reacting to hover events.

### (AI) bot strategy

Given `board` and `ctx` what move(s) should the bot make?

To emulate thinking time for bot in case of multiple moves within a turn, subsequent moves
must be wrapped in setTimeout, this is not (yet) handled by the framework.

## state provided and handled by "framework" (strategyGameFactory)

`board` is updated after every move

`ctx` is an object and will contain the following (extendable):
- `shouldRoleSelectorMoveNext`: boolean
- `chosenRoleIndex`: null/0/1 (the role that the player chooses at the beginning)
- `turnStage`: in game with multi-stage turns you may use this param to track to stage
    if you need it in common parts such as step description as well

`events` is and objects that will contain the following (extendable):
- `endTurn`: a function
- `endGame`: a function with optional winnerIndex specified, if not, last player to move is the winner
- `setTurnStage`: a function to set `turnStage`

## Things to look out for

- are the starting positions representative of the game complexity?
- can the player win with a not-winning strategy?
- is the game (mostly) mobile-friendly?
- is the game usable only with keyboard (without a mouse)?
- is it clear what the player should do next?
- can the player undo their last interaction in turns with multiple moves?
- is it easy to guess the winning strategy from watching the AI play?
- do not allow the player interacting with the game while the other player's step is in progress, use `ctx.shouldRoleSelectorMoveNext`
- never modify react state (e.g. the board) in place
- check for console errors/warnings as well, i.e. missing keys on react components
- pretend AI is thinking in turns with multiple moves (for one move it is handled by framework)

## Technologies used

- Node.js for the development server and building the application
- React frontend framework ([official tutorial](https://react.dev/learn) is a good starting point)
- [optional] Tailwindcss for styling with utility classes
- [optional] vitest for unit testing
- github actions for CI/CD.
- github pages as hosting
- [goatcounter](https://agondolkodasorome.goatcounter.com/) as usage tracker (Ildi has access)
