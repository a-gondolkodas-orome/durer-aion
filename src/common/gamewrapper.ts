import { Game } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';

function chooseRole({ G, ctx, playerID }: any, firstPlayer: string) { // TODO: type
  G.firstPlayer = firstPlayer;
}

function chooseNewGameType({ G, ctx, playerID, random, events }: any, difficulty: string) {
  let newG = {
    ...G,
    difficulty: difficulty,
    firstPlayer: null,
    winner: null,
    numberOfTries: G.numberOfTries + (difficulty === "live" ? 1 : 0),
  }
  events.endTurn();
  return {
    ...newG,
  }
};

function setStartingPosition({ G, ctx, playerID, random, events }: any, startingPosition: any) { // TODO: type
  events.endTurn();
  return {
    ...G,
    ...startingPosition,
  };
};

function getTime({ G, ctx, playerID, events }: any){
  if (playerID !== "0") {
    return INVALID_MOVE;
  };
  G.milisecondsRemaining = G.end.getTime() - new Date().getTime();
};



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
        moves: { chooseNewGameType, setStartingPosition, getTime },
        //endIf: ({ G, ctx, playerID }) => { return G.difficulty !== null && G.winner === null },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
        },
        start: true,
      },
      chooseRole: {
        moves: { chooseRole, getTime },
        endIf: ({ G, ctx, playerID }) => { return G.firstPlayer !== null },
        next: "play",
        turn: { order: TurnOrder.RESET }
      },
      play: {
        moves: { ...game.moves, getTime },
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
