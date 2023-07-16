# durer-jatekok

Code for the online, client-side versions of past strategy games at the Dürer Math Competition.

The deployed version is here: https://a-gondolkodas-orome.github.io/durer-jatekok/.

# Development

Feel free to commit directly to the default (master) branch. If in doubt, send a pull request instead.
Goal: only commit to the master branch if existing games keep working :)

When you push to the default (master) branch, the tests are run, and if they are successful, the project is deployed to the live website.

## Adding a new game

To keep track of who works on which game, use [this pinned issue](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/1) to track it.

TL;DR;

1. Create a react component for the game under `src/components/games`.
2. Add the game component to the router in `src/components/app/app.js`.
3. Add the game metadata to `src/components/games/gameList.js`.

*For more information, see Section [How to Develop](#how-to-develop)*

## Project setup

- install Node.js on your computer globally
- in the project directory terminal run

```bash
npm ci
```

## Useful npm commands

### Compiles and hot-reloads for development

```bash
npm run dev
```

Known issue: sometimes weird bugs happen which disappear if you delete the `.parcel-cache`
directory manually and re-load.

### Run tests

```bash
npm run test # lint and tests (as GA)
```

```bash
npm run test:watch # unit tests in watch mode
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

If you need a new, common parameter, just pass it down from `strategyGameFactory`.

## Must have for a new game

*It is recommended to copy and modify an existing, similar game.*

```js
// a React component with `board`, `setBoard`, `ctx` props
// `ctx` is an object and will contain the following (extendable):
// - `shouldPlayerMoveNext: boolean
// - endPlayerTurn: a function, see below
// - playerIndex: null/0/1 (the role that the player chooses at the beginning)
// - turnStage: in game with multi-stage turns you may use this param to track to stage
//     if you need it in common parts such as step description as well
// - setTurnStage
const GameBoard = ({ board, setBoard, ctx }) => {
  return (
    <section className="p-2 shrink-0 grow basis-2/3">   
        <button
          onClick={() => ctx.endPlayerTurn({ newBoard: {}, isGameEnd: false })}
        ></button>
    </section>
  );
};

const Game = strategyGameFactory({
  // a React component (can be text in <></>)
  rule,
  // a short string
  title: 'Hunyadi és a janicsárok',
  GameBoard,
  G: {
    // a function returning a string with 1 optional parameter: an object containing `playerIndex`, `turnStage`, etc.
    getPlayerStepDescription,
    // a function returning a new, possibly random board object
    generateNewBoard,
    // a function with `{ board, playerIndex }` parameter returning `{ newBoard, isGameEnd, winnerIndex }`
    getGameStateAfterAiTurn
  }
});

// React component for the whole game which should be added to router
export const HunyadiAndTheJanissaries = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
```

### Game end, determining winner

When ending the turn, specify the game state with an object `{ newBoard, isGameEnd: false }` or
`{ newBoard, isGameEnd: true, winnerIndex: null/0/1 }`

If the winner can be determined from who moved last before the game ended, it is enough to pass `winnerIndex: null`.

`ctx.endPlayerTurn` should be called with this and also `getGameStateAfterAiTurn` should return
such an object.

## Things to look out for

- are the starting positions representative of the game complexity?
- can the player win with a not-winning strategy?
- is the game (mostly) mobile-friendly?
- is it clear what the player should do next?
- is it easy to guess the winning strategy from wathing the AI play?
- do not allow the player interacting with the game while the other player's step is in progress, use `ctx.shouldPlayerMoveNext`
- never modify react state (e.g. the board) in place

## Technologies used

- Node.js for the development server and building the application
- React frontend framework ([official tutorial](https://react.dev/learn) is a good starting point)
- [optional] Tailwindcss for styling with utility classes
- [optional] jest for unit testing
- github actions for CI/CD.
- github pages as hosting
- [goatcounter](https://agondolkodasorome.goatcounter.com/) as usage tracker (Ildi has access)
