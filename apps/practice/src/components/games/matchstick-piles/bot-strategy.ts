import { sample } from 'lodash';
import type { BotMove, BotStrategy } from '../../strategy-game-factory';
import { type Board, type Moves } from './gameplay';

// --- Optimal strategy -------------------------------------------------------
// Impartial game: the Grundy value of a single pile of size n is
//   g(0)=0, g(1)=1, g(2)=2, and for n>=3: 2 if n is even, 0 if n is odd.
// The value of a position is the XOR of its piles; the player to move wins iff
// that XOR is non-zero. A winning move is any move leaving the opponent an
// all-zero XOR position.
const grundy = (n: number): number => {
  if (n <= 2) return n;
  return n % 2 === 0 ? 2 : 0;
};

const xorSum = (board: Board): number => board.reduce((acc, n) => acc ^ grundy(n), 0);

export type Move =
  | { type: 'remove'; pileId: number }
  | { type: 'split'; pileId: number; firstPart: number };

const legalMoves = (board: Board): Move[] => {
  const result: Move[] = [];
  board.forEach((size, pileId) => {
    result.push({ type: 'remove', pileId });
    for (let firstPart = 1; firstPart < size; firstPart++) {
      result.push({ type: 'split', pileId, firstPart });
    }
  });
  return result;
};

const applyMove = (board: Board, move: Move): Board => {
  if (move.type === 'remove') {
    return board.map((n, i) => (i === move.pileId ? n - 1 : n)).filter(n => n > 0);
  }
  const size = board[move.pileId];
  return board.flatMap((n, i) =>
    i === move.pileId ? [move.firstPart, size - move.firstPart] : [n]
  );
};

type Bot = BotStrategy<Board, Moves>

const asBotMove = (move: Move): BotMove<Moves> =>
  move.type === 'remove'
    ? { move: 'removeMatch', args: [move.pileId] }
    : { move: 'splitPile', args: [move.pileId, move.firstPart] };

export const smartBotStrategy: Bot = ({ board }) => {
  const candidates = legalMoves(board);
  const winningMove = candidates.find(move => xorSum(applyMove(board, move)) === 0);
  // In a losing position no move wins against optimal play, so play a random
  // legal move and hope the opponent slips.
  return asBotMove(winningMove ?? sample(candidates)!);
};

export const randomBotStrategy: Bot = ({ board }) => {
  const candidates = legalMoves(board);
  // Grab an immediately winning move (one that empties the board) if there is
  // one; otherwise just play a random legal move.
  const winningNow = candidates.find(move => applyMove(board, move).length === 0);
  return asBotMove(winningNow ?? sample(candidates)!);
};
