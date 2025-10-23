import { INVALID_MOVE } from 'boardgame.io/core';
import { currentPlayer, GameType } from '../../../common/types';

type Cell = null | "forbidden";

export interface MyGameState {
  board: Array<Cell>;
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type I was Game<MyGameState>
  name: "chess-bishops",
  setup: () => ({ board: Array(64).fill(null) }),
  moves: {
    clickCell: ({ G, ctx, playerID }, cellID: number) => {
      if (G.board[cellID] !== null) {
        return INVALID_MOVE;
      }
      G.board[cellID] = "forbidden";
      // TODO: fix this strategy (it's wrong!!)
      [-9, -7, 7, 9].forEach(element => {
        let i = 1;
        while (cellID + element * i >= 0 && cellID + element * i < 64) {
          G.board[cellID + element * i] = "forbidden";
          i++;
        }
      });

      if (IsVictory(G.board)) {
        G.winner = currentPlayer(ctx);
      }
    },
  },
  possibleMoves: (G, ctx, playerID) => {
    let moves = [];
    for (let i = 0; i < 64; i++) {
      if (G.board[i] === null) {
        moves.push({ move: 'clickCell', args: [i] });
      }
    }
    return moves;
  },
};

// Return true if `cells` is in a winning configuration.
function IsVictory(cells: Array<Cell>) {
  return !cells.some(i => i === null);
}