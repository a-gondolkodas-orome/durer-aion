import { INVALID_MOVE } from 'boardgame.io/core';
import { GameType, GUESSER_PLAYER, JUDGE_PLAYER, otherPlayer, PlayerIDType } from '../../../common/types';

export interface MyGameState {
  stonesLeft: number;
  stonesRight: number;
  lastMoveFromLeftByPlayer: { [playerID: string]: boolean }; // tracks each player's last move
}

export const MyGameWrapper = (category: "E") => {
  // Set initial stones based on category
  const initialConfig = {left: 0, right: 0};

  const MyGame: GameType<MyGameState> = {
    name: "stones_e",
    setup: () => {
      return {
        stonesLeft: initialConfig.left,
        stonesRight: initialConfig.right,
        lastMoveFromLeftByPlayer: { '0': false, '1': false },
      }
    },

    moves: {
      takeStone: ({ G, ctx, playerID, events }, fromLeft: boolean) => {
        if (fromLeft) {
          if (G.lastMoveFromLeftByPlayer[ctx.currentPlayer] || G.stonesLeft <= 0) {
            return INVALID_MOVE;
          }

          G.stonesLeft--;
          G.lastMoveFromLeftByPlayer[ctx.currentPlayer] = true;
        }
        else {
          if (G.stonesRight <= 0) {
            return INVALID_MOVE;
          }

          G.stonesRight--;
          G.lastMoveFromLeftByPlayer[ctx.currentPlayer] = false;
        }

        const nextPlayerCanMove = () => {
          if (G.stonesRight > 0) return true;
          const nextPlayer = otherPlayer(ctx.currentPlayer as PlayerIDType);
          if (G.stonesLeft > 0 && !G.lastMoveFromLeftByPlayer[nextPlayer]) return true;
          return false;
        };

        if (!nextPlayerCanMove()) {
          // Current player wins (opponent cannot move)
          G.winner = ctx.currentPlayer as PlayerIDType;
        }

        // Handle winning streak for live difficulty
        if (G.difficulty === "live" && G.winner) {
          if (G.winner === GUESSER_PLAYER) {
            G.winningStreak = G.winningStreak + 1;
            if (G.winningStreak >= 2) {
              switch (G.numberOfLoss) {
                case 0: G.points = 12; break;
                case 1: G.points = 9; break;
                case 2: G.points = 6; break;
                case 3: G.points = 4; break;
                case 4: G.points = 3; break;
                default: G.points = 2; break;
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

    possibleMoves: (G, ctx) =>  {
      let moves = [];
      
      if (G.stonesRight > 0) {
        moves.push({ move: 'takeStone', args: [false] });
      }
      if (G.stonesLeft > 0 && !G.lastMoveFromLeftByPlayer[ctx.currentPlayer]) {
        moves.push({ move: 'takeStone', args: [true] });
      }
      return moves;
    },

    turn: {
      onMove: ({ G, ctx, playerID, events }) => {
        if (playerID === GUESSER_PLAYER) {
          let currentTime = new Date();
          if (currentTime.getTime() - new Date(G.end).getTime() > 1000 * 10) {
            events.endGame();
          }
        }
      },
      onEnd: ({ G, ctx, playerID, events }) => {
        if (playerID === JUDGE_PLAYER) {
          let currentTime = new Date();
          if (currentTime.getTime() - new Date(G.end).getTime() >= 0) {
            events.endGame();
          }
        }
      }
    },
  };
  return MyGame;
}
