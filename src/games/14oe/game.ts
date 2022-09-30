import { INVALID_MOVE } from 'boardgame.io/core';
import { currentPlayer, GameType, PlayerIDType } from '../../common/types';

export interface MyGameState {
  playerNumbers: number[];
  enemyNumbers: number[];
  remainingNumbers: number[];
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type
  name: "14oe",
  setup: () => ({ playerNumbers: [], enemyNumbers: [], remainingNumbers: [1,2,3,4,5,6,7,8,9] }),

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
        G.winner = winner;
        if(winner === "0"){
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

  console.log(first, second, remaining)

  if(remaining.length === 0){
    if(first.length === 5){
      return "1";
    } // Enemy wins
    return "0"; //Player wins
  }

  const RSOROK=[[8,3,4],[1,5,9],[6,7,2],[8,1,6],[3,5,7],[4,9,2],[8,5,2],[4,5,6]];

  for(let i of RSOROK){

    if(first.includes(i[0]) && first.includes(i[1]) && first.includes(i[2])){
      return "0"; // Player wins
    }

    if(second.includes(i[0]) && second.includes(i[1]) && second.includes(i[2])){
      return "1"; // Enemy wins
    }
  }

  return ""; // No winner yet
}