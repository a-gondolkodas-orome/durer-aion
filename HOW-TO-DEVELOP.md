Create the following 4 files: `board.tsx`, `game.ts`, `main.tsx`, `strategy.ts`.

### Game

```js
{
    // GameState when user loads the webpage, and at the beginning of every match, if startingPosition is not defined.
    setup: () => G

    // Moves, that can user or bot do. It should also change the value of G.winner, when someone won.
    moves: {
        A: ({G, ctx, ...args}) => {},
    }

    // Everything below is OPTIONAL

    // Gamestate at the beginning of every match. 
    startingPosition: ({G, ctx, ..args}) => {}

    // When the computer play random, it can choose a possible move from this
    possibleMoves: ({G, ctx, ..args}) => {}

    // How many moves can be played by a player. If it is not defined, then it's default value is: {minMoves: 1, maxMoves: 1}
    turn: ({G, ctx, ...args}) => {
        // You can restrict the number of moves:
        minMoves: 1,
        maxMoves: 1,
        // and/or: If this function return true, then turn will be ended:
        endIf: ({G, ctx, ..args}) => {}
    }
}
```

### Board

### Strategy