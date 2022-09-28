import { INVALID_MOVE } from 'boardgame.io/core';
import { currentPlayer, GameType, PlayerIDType } from '../../common/types';

export type Position = (0|1|null)[][];

export interface MyGameState {
  cells: Position;
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type
  name: "14od",
  setup: () => ({ cells: Array.from({length: 7},() => new Array(7).fill(null))}),

  moves: {
    clickCell: ({ G, ctx, events }, cellID: [number, number]) => {
      if (G.cells[cellID[0]][cellID[1]] !== null) { // TODO: more checks
        return INVALID_MOVE;
      }
      G.cells[cellID[0]][cellID[1]] = parseInt(currentPlayer(ctx)) as 0|1;
      let winner = getWinner(G.cells);
      if (winner === "0" || winner === "1") {
        G.winner = currentPlayer(ctx);
        if(currentPlayer(ctx) === "0"){
          G.winningStreak = G.winningStreak + 1;
          if(G.winningStreak >= 2){
            G.points = 12-G.numberOfLoss*2; // TODO
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
    let moves = [1];
    // TODO
    return moves;
  },
};

function getWinner(cells: Position): string {
  return "0"; // Player wins
  return "1"; // Enemy wins
  return ""; // No winner yet
}