import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType } from '../../common/types';

export interface MyGameState {
  pile: number;
  milisecondsRemaining: number;
  start: string;
  end: string;
}
const lengthOfCompetition = 30 * 60; // seconds

export const MyGame: GameType<MyGameState> = { // TOOO: solve type (It was Game<MyGameState>)
  name: "17o",
  setup: () => {
    return {
      pile: 17,
      milisecondsRemaining: 1000 * lengthOfCompetition,
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1000 * lengthOfCompetition).toISOString(),
    }
  },

  moves: {
    changePile: ({ G, ctx, playerID, events }, K: number) => {
      if (K !== 0 && K !== 1) {
        return INVALID_MOVE;
      }
      if (K === 1 && G.pile % 2 === 1) {
        return INVALID_MOVE;
      }
      if (K === 0) {
        G.pile -= 1;
      }
      if (K === 1) {
        G.pile /= 2;
      }
      if (G.pile === 0) {
        G.winner = ctx.currentPlayer === "0" ? "0" : "1";
      }

      if (G.difficulty === "live") {
        if (G.winner === "0") {
          G.winningStreak = G.winningStreak + 1;
          if (G.winningStreak >= 2) {
            switch (G.numberOfLoss) {
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
      }
      events.endTurn();
    },
    getTime({ G, ctx, playerID, events }) {
      if (playerID !== "0") {
        return INVALID_MOVE;
      }
      G.milisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
    }
  },

  possibleMoves: (G, ctx, playerID) => {
    let moves = [{ move: 'changePile', args: [0] }];
    if (G.pile % 2 === 0) {
      moves.push({ move: 'changePile', args: [1] })
    }


    return moves
  },

  turn: {
    onMove: ({ G, ctx, playerID, events }) => {
      console.log("onMove")
      if (playerID === "0") {
        let currentTime = new Date();
        if (currentTime.getTime() - new Date(G.end).getTime() > 1000 * 10) {
          // Do not accept any answer if the time is over since more than 10 seconds
          events.endGame();
        }
      }
    },
    onEnd: ({ G, ctx, playerID, events }) => {
      console.log("onEnd")
      if (playerID === "1") {
        let currentTime = new Date();
        if (currentTime.getTime() - new Date(G.end).getTime() <= 0) {
          // Do not accept any answer if the time is over
          events.endGame();
        }
      }
    }
  },

};
