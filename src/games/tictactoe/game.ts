import { INVALID_MOVE } from 'boardgame.io/core';
import { currentPlayer, GameType, GUESSER_PLAYER, PlayerIDType } from '../../common/types';

type Cell = Array<null | PlayerIDType>;

export interface MyGameState {
  cells: Cell;
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type
  name: "tic-tac-toe",
  setup: () => ({ cells: Array(9).fill(null) }),

  moves: {
    clickCell: ({ G, ctx, playerID, events }, cellID: number) => {
      if (G.cells[cellID] !== null) {
        return INVALID_MOVE;
      }
      G.cells[cellID] = currentPlayer(ctx);

      if (IsVictory(G.cells) || IsDraw(G.cells)) {
        G.winner = currentPlayer(ctx);
        if(currentPlayer(ctx) === GUESSER_PLAYER){
          G.winningStreak = G.winningStreak + 1;
          if(G.winningStreak >= 2){
            G.points = 12-G.numberOfLoss*2;
            events.endGame();
          }
        } else {
          G.winningStreak = 0;
          G.numberOfLoss += 1;
        }
      }
    }
  },

  possibleMoves: (G, ctx, playerID) => {
    let moves = [];
    for (let i = 0; i < 9; i++) {
      if (G.cells[i] === null) {
        moves.push({ move: 'clickCell', args: [i] });
      }
    }
    return moves;
  },
};

// Return true if `cells` is in a winning configuration.
function IsVictory(cells: Cell) {
  const positions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6],
    [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
  ];

  const isRowComplete = (row: number[]) => {
    const symbols = row.map(i => cells[i]);
    return symbols.every(i => i !== null && i === symbols[0]);
  };

  return positions.map(isRowComplete).some(i => i === true);
}

// Return true if all `cells` are occupied.
function IsDraw(cells: Array<null | string>) {
  return cells.filter(c => c === null).length === 0;
}

