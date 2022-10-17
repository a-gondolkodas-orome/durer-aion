import { Game } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';

function chooseRole({ G, ctx, playerID }: any, firstPlayer: string) { // TODO: type
  G.firstPlayer = firstPlayer;
}

function chooseNewGameType(game: any) { // TODO: type
  return ({ G, ctx, playerID, random }: any, difficulty: string) => {
    let newG = {
      ...G,
      difficulty: difficulty,
      firstPlayer: null,
      winner: null,
      numberOfTries: G.numberOfTries + (difficulty === "live" ? 1 : 0),
    }
    return {
      ...newG,
    }
  };
    // In case of no difficulty, it is undefined (which is not null)
}

function setStartingPosition(game: any) {
  return ({ G, ctx, playerID, random }: any, startingPosition: any) => {
    return {
      ...G,
      ...startingPosition,
    }
  };
}


export function gameWrapper(game: any): Game<any> { // TODO: solve types
  return {
    setup: () => ({ ...game.setup(), firstPlayer: null, difficulty: null, winner: null, numberOfTries: 0, numberOfLoss: 0, winningStreak: 0, points: null}),
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    minPlayers: 2,
    maxPlayers: 2,
    phases: {
      startNewGame: {
        moves: { chooseNewGameType: chooseNewGameType(game), setStartingPosition: setStartingPosition(game)  },
        //endIf: ({ G, ctx, playerID }) => { return G.difficulty !== null && G.winner === null },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
          minMoves: 1,
          maxMoves: 1
        },
        start: true,
      },
      chooseRole: {
        moves: { chooseRole },
        endIf: ({ G, ctx, playerID }) => { return G.firstPlayer !== null },
        next: "play",
        turn: { order: TurnOrder.RESET }
      },
      play: {
        moves: { ...game.moves },
        endIf: ({ G, ctx, playerID }) => { return G.winner !== null },
        next: "startNewGame",
        turn: {
          order: {
            first: ({ G, ctx }) => G.firstPlayer === 0 ? 0 : 1,
            next: ({ G, ctx }) => {
              return (ctx.playOrderPos + 1) % ctx.numPlayers
            },
          },
          ...(!("turn" in game) && {
            minMoves: 1,
            maxMoves: 1
          }),
          ...game.turn,
        },
      },
    },
    ai: { enumerate: game.possibleMoves }
  };
};
