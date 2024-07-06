import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType } from '../../common/types';
import { sendDataStrategyEnd } from '../../common/sendData';
import { range } from 'lodash';

export interface MyGameState {
  circle: Array<boolean>;
  first: number;
  milisecondsRemaining: number;
  start: string;
  end: string;
}
const lengthOfCompetition = 30*60; // seconds


export const MyGame: GameType<MyGameState> = {
  name: 'removefromcircle',
  setup: () => {
    return {
      circle: [],
      first: -1,
      milisecondsRemaining: 1000*lengthOfCompetition,
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1000*lengthOfCompetition).toISOString(),
    }
  },

  moves: {
    removePoint: ({G, ctx, playerID, events }, P: number) => {
      if( P<0 || P>=G.circle.length) {
        return INVALID_MOVE;
      } else if( !G.circle[P]) {
        console.log("0");
        return INVALID_MOVE;
      } else if( P===0 && !(G.circle[1] || G.circle[G.circle.length-1])) {
        console.log('1');
        return INVALID_MOVE;
      } else if( P===G.circle.length-1 && !(G.circle[0] || G.circle[G.circle.length-2])) {
        console.log('2');
        return INVALID_MOVE;
      } else if( !(G.circle[P-1] || G.circle[P+1])) {
        console.log("3")
        return INVALID_MOVE;
      }

      G.circle[P] = false;
      let isGameEnd = true;
      if (G.circle[0] && G.circle[G.circle.length-1]){
        isGameEnd = false;
      };
      for(let i = 0; i<G.circle.length; i++) {
        if (G.circle[i] && G.circle[i+1]) {
          isGameEnd = false;
        }
      }

      if (isGameEnd) {
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
            if (process.env.REACT_APP_WHICH_VERSION === "b") {
              localStorage.setItem("StrategyPoints", G.points.toString());
              sendDataStrategyEnd(null, G, ctx);
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
    let moves = [];
    if ((G.circle[1] || G.circle[G.circle.length-1]) && G.circle[0]) {
      moves.push({move: 'removePoint', args: [0]});
    }
    for (let i = 1; i<G.circle.length-1; i++) {
      if ((G.circle[i-1] || G.circle[i+1]) && G.circle[i]) {
        moves.push({move: 'removePoint', args: [i]});
      }
    }  
    if ((G.circle[0] || G.circle[G.circle.length-2]) && G.circle[G.circle.length-1]) {
      moves.push({move: 'removePoint', args: [G.circle.length-1]});
    }
    return moves;
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