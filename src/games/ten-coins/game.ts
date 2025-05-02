import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType, GUESSER_PLAYER, JUDGE_PLAYER, PlayerIDType } from '../../common/types';

export interface MyGameState {
  coins: Array<number>;
}
const lengthOfCompetition = 30*60; // seconds

export const MyGame: GameType<MyGameState> = { // TOOO: solve type (It was Game<MyGameState>)
  name: "ten-coins",
  setup: () => {
    return {
      coins: [1,1,1,1,1,1,1,1,1,1],
    }},

  moves: {
    changeCoins: ({ G, ctx, playerID, events }, K: number, L: number) => {
      if (!Number.isInteger(L) || !Number.isInteger(K) || K <= L ||L < 1 || !G.coins.includes(K)) {
        return INVALID_MOVE;
      }
      for(let i = 0; i < 10; i++){
        if(G.coins[i] === K) G.coins[i] = L;
      }
      const firstCoin = G.coins[0];
      if(G.coins.every(c => c === firstCoin)){
        G.winner = ctx.currentPlayer as PlayerIDType;
      }
      if(G.difficulty === "live")
        {
        if(G.winner === GUESSER_PLAYER){
          G.winningStreak = G.winningStreak + 1;
          if(G.winningStreak >= 2){
            switch(G.numberOfLoss){
              case 0:
                G.points = 12;
                break;
              case 1:
                G.points = 9;
                break;
              case 2:
                G.points = 6;
                break;
              case 3:
                G.points = 4;
                break;
              case 4:
                G.points = 3;
                break;
              default:
                G.points = 2;
                break;
            }
            events.endGame();
          }
        } else if (G.winner === JUDGE_PLAYER) {
          G.winningStreak = 0;
          G.numberOfLoss += 1;
        }
      }
      events.endTurn();
    },
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

  turn: {
    onMove: ({G, ctx, playerID, events }) => {
      if(playerID === GUESSER_PLAYER) {
        let currentTime = new Date();
        if(currentTime.getTime() - new Date(G.end).getTime() > 1000*10){
          // Do not accept any answer if the time is over since more than 10 seconds
          events.endGame();
        }
      }
    },
    onEnd: ({G, ctx, playerID, events }) => {
      if(playerID === JUDGE_PLAYER) {
        let currentTime = new Date();
        if(currentTime.getTime() - new Date(G.end).getTime() <= 0){
          // Do not accept any answer if the time is over
          events.endGame();
        }
      }
    }
  },
};
