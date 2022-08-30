import { INVALID_MOVE } from 'boardgame.io/core';
import { currentPlayer, GameType, PlayerIDType } from '../../common/types';

export type Position = [number, number];

const tableSize = [7, 7]; // [  numberOfRows-1, numberOfCols-1] 

export interface MyGameState {
  rookPosition: Position;
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type
  name: "14oc",
  setup: () => ({ rookPosition: [-1, -1] }),

  moves: {
    clickCell: ({ G, ctx }, cellID: Position) => {
      if (!(G.rookPosition <= cellID && cellID <= tableSize &&
        (G.rookPosition[0] === cellID[0]) !== (G.rookPosition[1] === cellID[1]))) {
        return INVALID_MOVE;
      }
      G.rookPosition = cellID;

      if (G.rookPosition[0] === tableSize[0] && G.rookPosition[1] === tableSize[1]) {
        G.winner = currentPlayer(ctx);
      }
    }
  },

  startingPosition: ({ random }) => ({
    rookPosition: [random.Die(3)-1, random.Die(3)-1]
  }),

  possibleMoves: (G, ctx, playerID) => {
    let moves = [];
    for (let i = G.rookPosition[0] + 1; i <= tableSize[0]; i++) {
      moves.push({ move: 'clickCell', args: [[i, G.rookPosition[1]]] });
    }
    for (let i = G.rookPosition[1] + 1; i <= tableSize[1]; i++) {
      moves.push({ move: 'clickCell', args: [[G.rookPosition[0], i]] });
    }
    return moves;
  },
};