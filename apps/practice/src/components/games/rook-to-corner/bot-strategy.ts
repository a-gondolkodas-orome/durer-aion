import { sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import { getAllowedMoves, isTarget, type Board, type Field } from './helpers';

export const randomBotStrategy: BotStrategy<Board> = ({ board }) =>
  ({ move: 'moveRook', args: [getRandomBotMove(board)] });

// Random play, but grab an immediate win (moving onto the bottom-right square)
// whenever one is available.
export const getRandomBotMove = (board: Board): Field => {
  const allowedMoves = getAllowedMoves(board);
  const winningMove = allowedMoves.find(isTarget);
  return winningMove ?? sample(allowedMoves)!;
};

export const smartBotStrategy: BotStrategy<Board> = ({ board }) =>
  ({ move: 'moveRook', args: [getOptimalSmartBotMove(board)] });

// The game is 2-heap Nim: the distances to the right and bottom edges are the
// two heaps, and each move shrinks exactly one of them. The losing
// (P-)positions are exactly the squares on the main diagonal (row === col),
// the bottom-right target being the terminal one. From a winning position we
// move back onto the diagonal; from a diagonal (losing) position every move
// loses to optimal play, so we make an arbitrary legal move and hope the
// opponent slips.
export const getOptimalSmartBotMove = (board: Board): Field => {
  const { row, col } = board.rookPosition;
  if (row < col) {
    return { row: col, col }; // move down onto the diagonal
  }
  if (row > col) {
    return { row, col: row }; // move right onto the diagonal
  }
  return sample(getAllowedMoves(board))!;
};
