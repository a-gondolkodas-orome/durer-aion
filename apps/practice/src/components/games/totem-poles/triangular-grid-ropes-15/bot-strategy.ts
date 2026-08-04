import { sample } from 'lodash';
import { getAllowedMoves, type Board } from './helpers';
import { findWinningMove } from './solver';
import type { BotStrategy } from '../../../strategy-game-factory';
import type { Moves } from './triangular-grid-ropes-15';

type Bot = BotStrategy<Board, Moves>

//         0
//        1 2
//       3 4 5
//      6 7 8 9
//    10 11 12 13 14

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'stretchRope', args: [sample(getAllowedMoves(board))!] });

// The bot searches for a winning move every turn (see solver.ts), so it plays
// optimally whichever side it is on: as the second player it always wins, and
// as the first player it wins the moment the opponent makes a mistake. When the
// position is genuinely lost it plays on with a reasonable move.
export const smartBotStrategy: Bot = ({ board }) => {
  if (board.length === 0) {
    // The bot opens (and, from the empty board, is on the losing side). Open on
    // a side of the medial triangle — a natural, symmetric first move.
    return { move: 'stretchRope', args: [sample([{ from: 3, to: 5 }, { from: 3, to: 12 }, { from: 5, to: 12 }])!] };
  }
  const winningMove = findWinningMove(board);
  return { move: 'stretchRope', args: [winningMove ?? sample(getAllowedMoves(board))!] };
};
