# durer-jatekok

Code for the online, client-side versions of past strategy games at the Dürer Math Competition.

The deployed version is here: https://a-gondolkodas-orome.github.io/durer-jatekok/.

# Development

Feel free to commit directly to the default (master) branch. If in doubt, send a pull request instead. Prefer rebasing over merge commits.

When you push to the default (master) branch, the tests are run, and if they are successful, the project is deployed to the live website.

## Adding a new game

To keep track of who works on which game, use [this pinned issue](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/1) to track it.

TL;DR;

Currently each game should have a folder under `src/components/games` and its metadata listed in `src/components/games/games.js`. See existing examples for inspiration, and the `demonstration` game for a minimal example.

*For more information, see Section [How to Develop](#how-to-develop)*

## Project setup

- install Node.js on your computer globally
- in the project directory terminal run

```bash
npm ci
```

## Useful npm commands

### Compiles and hot-reloads for development

```
npm run start-dev
```

### Run tests

```bash
npm run test # audit, lint and tests (as GA)
```

```bash
npm run test:unit # unit tests
```

```bash
npm run test:watch # unit tests in watch mode
```

For further options see `package.json`.

## IDE setup

If you are using VS Code, [Volar VS Code extension](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) is highly recommended.
Tailwindcss is used for some of the styling, the [tailwind VS Code extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) is also recommended.


# Other

- simple usage tracking at https://agondolkodasorome.goatcounter.com/ (Ildi has access)

# How to develop

For general information and installation instructions, see the [readme](./README.md).

This project uses the Vue.js frontend framework, the [official tutorial](https://vuejs.org/tutorial/#step-1) is a good starting point to understand the syntax and most important concepts.

To keep track of who works on which game, use [this pinned issue](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/1) to track it.

## Must have for a new game

*It is recommended to copy and modify the files of an existing, similar game (see demonstration game for a minimal example).*

The `board` field on the store is the single source of truth for the state of the board. The AI step won't have access to other component specific data. You can read/write it from your component after mapping it with `mapState()`.

The game logic must have the following 3 exported values
- `isTheLastMoverTheWinner`: `true`, `false`, or `null` if winner is decided explicitly
- `generateNewBoard` a function which returns a javascript object representing the board (UI state) for a new game
- `getGameStateAfterAiMove` a function which has `board` as its first argument and `isPlayerTheFirstToMove` as its second argument and returns an object with properties `board`, `isGameEnd` and optionally `hasFirstPlayerWon`.

Store actions to call from your component code the manage the game progress:
- `initializeGame()`
- `endPlayerTurn()`: At the end of each move by the player, your component code must call `endPlayerTurn({ board, isGameEnd })` and optionally `hasFirstPlayerWon`.

Each game must have a folder under `src/components/games` and its metadata listed in `src/components/games/games.js`.
- Include a new game in `gameList` and `gameComponents` exported values as well.

Good to know
- Role selection and game restart is managed by `<game-siderbar>` component in the most common cases.
- The state of the board is stored in the `board` field of the store, so that the AI step has easy access to it.

### Game end, determining winner

When ending the turn, specify the game state with an object `{ board, isGameEnd: true/false }`.

If the winner can be determined from who moved last before the game ended, you do not have to identify if the player or the AI is the winner. Define the `isTheLastMoverTheWinner` game level constant in the `strategy.js` and when you provide `isGameEnd: true`, the winner will be calculated by the common logic in store.

Otherwise, if the game ended, also calculate and return whether the first or the second player is the winner. In your component code, the `isPlayerTheFirstToMove` field on the common state can help. In the AI move, `getGameStateAfterAiMove()` function will receive `isPlayerTheFirstToMove` as its second argument.

## Technologies used

- Node.js for the development server and building the application
- Vue.js frontend framework ([official tutorial](https://vuejs.org/tutorial/#step-1) is a good starting point)
- [vuex](https://vuex.vuejs.org/guide/state.html) for state management with Vue.js
- [optional] Tailwindcss for styling with utility classes
- [optional] jest for unit testing
- github actions for CI/CD.
- github pages as hosting
- goatcounter as usage tracker

## Project structure

- `src/components` vue components
- `src/components/games/games.js` as a reference to implemented games
- `src/store` for game-agnostic logic with vuex: managing role selection, game end, game restart, AI moves
- `src/lib` game-agnostic utility functions, such as random numbers

## Things to look out for

- do not allow the player interacting with the game while the other player's step is in progress, use store getter `shouldPlayerMoveNext` to check for this in your client side code
- reset component state when game is restarted
- it is highly recommended to add unit tests at least for the AI strategy, place a `filename.spec.js` next to the `filename.js` you want to test.
- Html classes starting with `js-` are there for unit testing purposes.
- https://v2.vuejs.org/v2/guide/components.html#data-Must-Be-a-Function

## Handling work in progress

To avoid big merge conflicts or parallel work, aim to push frequently in small iterations to the default (master) branch.

You can include work in progress games safely on the default (master) branch if you set `isHiddenFromOverview: true` in [`games.js`](./src/components/games/games.js).
Or even more easily, you create a game but do not add it to gameList.

## Vue.js notes

- separate .js and .html files are used for each component
- the project uses locally registered components, meaning you have to import the component file and add it to components in your component .js file if you want to use another vue component.
- refer to dynamic js values in your html file with starting your attribute name with `:`, e.g. `<button :class="color"></button>` to refer to `color` javascript field.
