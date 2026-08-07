import { random } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import type { Board, Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const currentPlayer = ctx.currentPlayer!;
  // start with a random place as a first step
  if (currentPlayer === 0) {
    const allowedPlaces = [0, 1, 2].filter(i => board[1][i] !== null);
    if (allowedPlaces.length === 3) {
      return { move: 'removeSymbol', args: [random(0, 2)] };
    }
  }

  // as a first player still try to win if second player may not play optimally
  if (currentPlayer === 0) {
    // pairs to still have chance
    // we have two cards left to choose from so at least one option is available
    const pairs = [[0, 2], [1, 0], [2, 1], [0, 0], [1, 1], [2, 2]];
    for (const p of pairs) {

      // first is occupied, second is not from given pair
      if (board[0][p[0]] === null && board[1][p[1]] !== null) {
        return { move: 'removeSymbol', args: [p[1]] };
      }
    }
  }

  // as a second player proceed with chosing useless player's piece

  if (currentPlayer === 1) {
    // pairs beating each other
    const pairs = [[0, 1], [1, 2], [2, 0]];
    for (const p of pairs) {
      // first is not occupied, second is occupied from given pair
      if (board[0][p[0]] !== null && board[1][p[1]] === null) {
        return { move: 'removeSymbol', args: [p[0]] };
      }
    }
  }

  // Unreachable: player 0 always moves first, so by any player-1 turn at least one
  // of player 1's cards is already gone and a pair above matches. A player-0 turn
  // likewise always returns (full board -> random, otherwise a pair matches).
  throw new Error('no removable card found: the bot should always have a move here');
};
