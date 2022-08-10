import { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';

export interface MyGameState {
  current: number;
  target: number;
  restricted: null | number;
}

export const MyGame : Game<any> = { // TOOO: solve type (It was Game<MyGameState>)
    setup: () => ({ current: 0, target: 100, restricted: null }), // TODO: Random

    moves: {
        increaseNumber: ({G, ctx, playerID}, numberToAdd) => {
            if (!Array.from(Array(12).keys()).map(x => x+1).includes(numberToAdd)
            || G.restricted == numberToAdd) {
              return INVALID_MOVE;
            }
            G.current = G.current + numberToAdd;
            G.restricted = 13 - numberToAdd;
            if (G.current >= G.target) {
              G.winner = ctx.currentPlayer === "0" ? "1" : "0";
            }
          }
        },

    //TODO rename this function to startingPosition
    endIf: ({G,ctx,playerID}) => ({ current: 0, target: G.target+100, restricted: null }),

    ai: {
        enumerate: (G, ctx, playerID) => {
          let moves = [];
          for (let i = 1; i <= 12; i++) {
            if (G.restricted === null || 13-G.restricted !== i) {
              moves.push({ move: 'increaseNumber', args: [i] });
            }
          }
          return moves
        },
    },
};
