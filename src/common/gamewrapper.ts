import { Game } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';

function chooseRole({ G, ctx, playerID }: any, firstPlayer: string) { // TODO: type
  G.firstPlayer = firstPlayer;
}

export function gameWrapper(game: any): Game<any> { // TODO: solve types
  return {
    setup: () => ({ ...game.setup(), firstPlayer: null, difficulty: null, winner: null }),
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    minPlayers: 2,
    maxPlayers: 2,
    phases: {
      startNewGame: {
        moves: {
          chooseNewGameType({ G, ctx, playerID }: any, difficulty: string) { // TODO: type
            let startingPosition = game.setup();
            if ("startingPosition" in game) {
              startingPosition = game.startingPosition({ G, ctx, playerID })
            }
            return { ...startingPosition, difficulty: difficulty, firstPlayer: null, winner: null };
            // In case of no difficulty, it is undefined (which is not null)
          }
        }, // HELP: How can I outsource this function, like the chooseRole function?
        endIf: ({ G, ctx, playerID }) => { return G.difficulty !== null && G.winner === null },
        next: "chooseRole",
        turn: { order: TurnOrder.RESET },
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
