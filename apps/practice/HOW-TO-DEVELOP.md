# How to develop

For general information and installation instructions, see the [readme](./README.md).

To keep track of who works on which game, use [this pinned issue](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/1) to track it.

## Must have for a new game

*It is recommended to copy and modify the files of an existing game (see demonstration game for a minimal example).*

The game logic must have the following 3 exported values
- `isTheLastMoverTheWinner`: `true`, `false`, or `null` if winner is decided explicitly
- `generateNewBoard` a function which returns a javascript object representing the board (UI state) for a new game
- `getGameStateAfterAiMove` a function which

Store actions to call from your component code the manage the game progress:
- `initializeGame()`
- `playerMove()`: At the end of each move by the player, your component code must call `playerMove({ board, isGameEnd })` and optionally `hasFirstPlayerWon`.

Each game must have a folder under `src/components/games` and its metadata listed in `src/components/games/games.js`.
- Include a new game in `gameList` and `gameComponents` exported values as well.

Role selection and game restart is managed by `<game-siderbar>` component in the most common cases.

## Technologies used

- Node.js for the development server
- Vue.js frontend framework ([official tutorial](https://vuejs.org/tutorial/#step-1) is a good starting point)
- [optional] Tailwindcss for styling with utility classes
- [optional] jest for unit testing
- [vuex](https://vuex.vuejs.org/guide/state.html) for state management with Vue.js
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
- it is highly recommended to add unit tests at least for the AI strategy, place a `filename.spec.js` next to the `filename.js` you want to test.
- Html classes starting with `js-` are there for unit testing purposes.

## Handling work in progress

To avoid big merge conflicts or parallel work, aim to push frequently in small iterations to the default branch.

You can include work in progress games safely on the default branch if you set `isHiddenFromOverview: true` in [`games.js`](./src/components/games/games.js).

## Vue.js notes

- separate .js and .html files are used for each component
- refer to dynamic js values in your html file with starting your attribute name with `:`, e.g. `<button :class="color"></button>` to refer to `color` javascript field.
