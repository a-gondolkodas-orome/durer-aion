import { INVALID_MOVE } from 'boardgame.io/core';
import { currentPlayer, GameType, PlayerIDType } from '../../common/types';

export type Cell = Array<null | PlayerIDType>;

export interface MyGameState {
  playerNumbers: number[];
  enemyNumbers: number[];
  remainingNumbers: number[];
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type
  name: "14od",
  setup: () => ({ cells: Array(9).fill(null), playerNumbers: [], enemyNumbers: [], remainingNumbers: [1,2,3,4,5,6,7,8,9] }),

  moves: {
    clickCell: ({ G, ctx, playerID, events }, n: number) => {
      if (!G.remainingNumbers.includes(n)) {
        return INVALID_MOVE;
      }
      if (playerID === "0") {
        G.playerNumbers.push(n);
      } else {
        G.enemyNumbers.push(n);
      }
      G.remainingNumbers = G.remainingNumbers.filter(x => x !== n);
      let winner = getWinner(G.playerNumbers, G.enemyNumbers, G.remainingNumbers);
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
    let moves = [];
    for (let i of G.remainingNumbers) {
      moves.push({ move: 'clickCell', args: [i] });
    }
    return moves;
  },
};

// Return true if `cells` is in a winning configuration.
function getWinner(first: number[], second: number[], remaining: number[]) : string {
  return ""; // No winner yet
  return "0"; // Player wins
  return "1"; // Enemy wins
}