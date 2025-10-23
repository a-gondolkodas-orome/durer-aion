import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType, GUESSER_PLAYER, PlayerIDType } from '../../../common/types';

export interface MyGameState { }

export type Position = [number, number];

export const MyGame: GameType<MyGameState> = { // TOOO: solve type
  name: "15oe",
  setup: () => ({ }),

  moves: {
    clickCell: ({ G, ctx, playerID, events }, s: string) => {
      if (false) { // TODO: more checks
        return INVALID_MOVE;
      }
      if (playerID === GUESSER_PLAYER) {
        
      } else {
        
      }
      
      let winner = getWinner();
      if (winner !== null) {
        G.winner = winner;
        if(winner === GUESSER_PLAYER){
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
    
    return moves;
  },
};

function getWinner(): PlayerIDType | null {
  return null;

}