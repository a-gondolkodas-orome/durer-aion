import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType } from '../../common/types';

export interface MyGameState {
  coins: Array<number>;
}

export const MyGame: GameType<MyGameState> = { // TOOO: solve type (It was Game<MyGameState>)
  name: "ten-coins",
  setup: () => ({ coins: [4,4,4,4,4,4,4,4,4,4] }),

  moves: {
    changeCoins: ({ G, ctx, playerID }, K: number, L: number) => {
      if (K < L || !G.coins.includes(K)) {
        return INVALID_MOVE;
      }
      G.coins.forEach(c => {if(c == K) return L; else return c})
      const firstCoin = G.coins[0];
      if(G.coins.every(c => c == firstCoin)){
        G.winner = ctx.currentPlayer === "0" ? "1" : "0";
      }
    }
  },

  startingPosition: ({ G, ctx, playerID }) => ({
    coins: [5,5,5,4,4,4,4,3,3,2] // TODO: Random
  }),

  possibleMoves: (G, ctx, playerID) => {
    let existingCoins = [false,false,false,false,false];
    for(let i = 0; i < 10; i++){
      existingCoins[G.coins[i]] = true;
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
