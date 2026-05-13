import { GameType, GUESSER_PLAYER, PlayerIDType } from '../../../common/types';

export type MyGameState = Record<string, never>;

export type Position = [number, number];

export const MyGame: GameType<MyGameState> = { // TOOO: solve type
  name: "15oe",
  setup: () => ({ }),

  moves: {
    clickCell: ({ G, events }, s: string) => {
      if (!s) {
        console.error('No specified move.')
      }

      const winner = getWinner();
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

  possibleMoves: () => {
    
    const moves = [1];
    
    return moves;
  },
};

function getWinner(): PlayerIDType | null {
  return null;

}