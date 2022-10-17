import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType } from '../../common/types';

export interface MyGameState {
  coins: Array<number>;
  milisecondsRemaining: number;
  start: Date;
  end: Date;
}
const lengthOfCompetition = 30*60; // seconds

export const MyGame: GameType<MyGameState> = { // TOOO: solve type (It was Game<MyGameState>)
  name: "ten-coins",
  setup: () => ({
    coins: [1,1,1,1,1,1,1,1,1,1],
    milisecondsRemaining: 1000*lengthOfCompetition,
    start: new Date(),
    end: new Date(Date.now()+1000*lengthOfCompetition),
  }),

  moves: {
    changeCoins: ({ G, ctx, playerID, events }, K: number, L: number) => {
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
      if(G.winner === "0"){
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
      } else if (G.winner === "1") {
        G.winningStreak = 0;
        G.numberOfLoss += 1;
      }
      events.endTurn();
    },
    getTime({ G, ctx, playerID, events }){
      if (playerID !== "0") {
        return INVALID_MOVE;
      }
      G.milisecondsRemaining = G.end.getTime() - new Date().getTime();
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

  turn: {
    onMove: ({G, ctx, playerID, events }) => {
      console.log("onMove")
      if(playerID === "0") {
        let currentTime = new Date();
        if(currentTime.getTime() - G.end.getTime() > 1000*10){
          // Do not accept any answer if the time is over since more than 10 seconds
          events.endGame();
        }
      }
    },
    onEnd: ({G, ctx, playerID, events }) => {
      console.log("onEnd")
      if(playerID === "1") {
        let currentTime = new Date();
        if(currentTime.getTime() - G.end.getTime() <= 0){
          // Do not accept any answer if the time is over
          events.endGame();
        }
      }
    }
  },

};
