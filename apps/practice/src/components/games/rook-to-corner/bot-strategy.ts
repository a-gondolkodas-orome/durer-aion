import { sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import { getAllowedMoves, isTarget, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

// Random play, but grab an immediate win (moving onto the bottom-right square)
// whenever one is available.
export const randomBotStrategy: Bot = ({ board }) => {
  const allowedMoves = getAllowedMoves(board);
  const winningMove = allowedMoves.find(isTarget);
  return { move: 'moveRook', args: [winningMove ?? sample(allowedMoves)!] };
};

// The game is 2-heap Nim: the distances to the right and bottom edges are the
// two heaps, and each move shrinks exactly one of them. The losing
// (P-)positions are exactly the squares on the main diagonal (row === col),
// the bottom-right target being the terminal one. From a winning position we
// move back onto the diagonal; from a diagonal (losing) position every move
// loses to optimal play, so we make an arbitrary legal move and hope the
// opponent slips.
export const smartBotStrategy: Bot = ({ board }) => {
  const { row, col } = board.rookPosition;
  if (row < col) {
    return { move: 'moveRook', args: [{ row: col, col }] }; // move down onto the diagonal
  }
  if (row > col) {
    return { move: 'moveRook', args: [{ row, col: row }] }; // move right onto the diagonal
  }
  return { move: 'moveRook', args: [sample(getAllowedMoves(board))!] };
};
