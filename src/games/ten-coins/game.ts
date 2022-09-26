import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType } from '../../common/types';

export interface MyGameState {
  current: number;
  target: number;
  restricted: null | number;
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type (It was Game<MyGameState>)
  name: "superstitious-counting",
  setup: () => ({ current: 0, target: 100, restricted: null }), // TODO: Random

  moves: {
    increaseNumber: ({ G, ctx, playerID }, numberToAdd: number) => {
      if (!Array.from(Array(12).keys()).map(x => x + 1).includes(numberToAdd)
        || G.restricted === numberToAdd) {
        return INVALID_MOVE;
      }
      G.current = G.current + numberToAdd;
      G.restricted = 13 - numberToAdd;
      if (G.current >= G.target) {
        G.winner = ctx.currentPlayer === "0" ? "1" : "0";
      }
    }
  },

  startingPosition: ({ G, ctx, playerID }) => ({
    current: 0,
    target: G.target + 100,
    restricted: null
  }),

  possibleMoves: (G, ctx, playerID) => {
    let moves = [];
    for (let i = 1; i <= 12; i++) {
      if (G.restricted === null || 13 - G.restricted !== i) {
        moves.push({ move: 'increaseNumber', args: [i] });
      }
    }
    return moves
  },
};
