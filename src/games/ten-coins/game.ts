import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType } from '../../common/types';

export interface MyGameState {
  coins: Array<number>;
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type (It was Game<MyGameState>)
  name: "ten-coins",
  setup: () => ({ coins: [1,1,1,1,1,1,1,1,1,1] }),

  moves: {
    changeCoins: ({ G, ctx, playerID }, K: number, L: number) => {
      if (K < L || !G.coins.includes(K)) {
        return INVALID_MOVE;
      }
      for(let i = 0; i < 10; i++){
        if(G.coins[i] == K) G.coins[i] = L;
      }
      const firstCoin = G.coins[0];
      if(G.coins.every(c => c == firstCoin)){
        G.winner = ctx.currentPlayer === "0" ? "0" : "1";
      }
      
      /*let winner = getWinner();
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
      }*/


    }
  },

  possibleMoves: (G, ctx, playerID) => {
    let existingCoins = [false,false,false,false,false];
    for(let i = 0; i < 10; i++){
      existingCoins[G.coins[i]-1] = true;
    }
    let moves = [];
    for(let k = 1; k <= 5; k++){
      if(existingCoins[k-1]){
        for(let l = 1; l < k; l++){
          moves.push({move: 'changeCoins', args: [k,l]})
        }
      }
    }
    return moves
  },
};
