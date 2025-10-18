import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType, GUESSER_PLAYER, JUDGE_PLAYER, PlayerIDType } from '../../../common/types';
import { Ctx } from 'boardgame.io';

export interface MyGameState {
  numbersOnTable: Array<boolean>;
  previousMove: number;
}

export function possibleMoves(G: MyGameState) {
  let moves = [];
  for (let i = 1; i<=G.numbersOnTable.length; i++) {
    if ((G.numbersOnTable[i-1] && (G.previousMove % i === 0 || i % G.previousMove === 0))) {
      moves.push({move: 'removeNumber', args: [i]});
    }
  }
  return moves;
}

export const MyGameWrapper = function (category: "C" | "D") {

  const MyGame: GameType<MyGameState> = {
    name: '19o' + category, 
    setup: () => {
      return {
        numbersOnTable: Array(8).fill(true),
        previousMove: -1,
      }
    },

    moves: {
      removeNumber: ({G, ctx, playerID, events }, choosenNumber: number) => {
        if( choosenNumber<=0 || choosenNumber>G.numbersOnTable.length || !G.numbersOnTable[choosenNumber-1] || (choosenNumber % G.previousMove !== 0 && G.previousMove % choosenNumber !== 0) ) {
          return INVALID_MOVE;
        }

        G.numbersOnTable[choosenNumber-1] = false;
        G.previousMove = choosenNumber;

        const isGameEnd = MyGame.possibleMoves(G, ctx, playerID as PlayerIDType).length === 0;

        if (isGameEnd) {
          G.winner = ctx.currentPlayer === GUESSER_PLAYER ? GUESSER_PLAYER : JUDGE_PLAYER;
        }

        if (G.difficulty === "live") {
          if (G.winner === GUESSER_PLAYER) {
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
          } else if (G.winner === JUDGE_PLAYER) {
            G.winningStreak = 0;
            G.numberOfLoss += 1;
          }
        }
        events.endTurn();
      },
    },
    
    possibleMoves: possibleMoves,

    turn: {
      onMove: ({ G, ctx, playerID, events }) => {
        if (playerID === GUESSER_PLAYER) {
          let currentTime = new Date();
          if (currentTime.getTime() - new Date(G.end).getTime() > 1000 * 10) {
            // Do not accept any answer if the time is over since more than 10 seconds
            events.endGame();
          }
        }
      },
      onEnd: ({ G, ctx, playerID, events }) => {
        if (playerID === JUDGE_PLAYER) {
          let currentTime = new Date();
          if (currentTime.getTime() - new Date(G.end).getTime() >= 0) {
            // Do not accept any answer if the time is over
            events.endGame();
          }
        }
      }
    },
  };
  return MyGame
}
