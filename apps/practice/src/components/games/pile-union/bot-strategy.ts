import { sample, sortBy } from 'lodash';
import type { BotMove, BotStrategy } from '../../strategy-game-factory';
import type { Board, Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

type MoveAction = { type: 'remove'; i: number } | { type: 'merge'; i: number; j: number }

const memo = new Map();

const isLosing = (board: Board) => {
  const sorted = sortBy(board);
  const key = sorted.join(',');
  if (memo.has(key)) return memo.get(key);
  if (sorted.length === 0) { memo.set(key, true); return true; }

  const hasWinningMove = sorted.some((size, i) => {
    const afterRemove = sorted.filter((_, idx) => idx !== i);
    if (size > 1) afterRemove.push(size - 1);
    if (isLosing(afterRemove)) return true;
    return sorted.slice(i + 1).some((_, rel) => {
      const j = i + 1 + rel;
      const afterMerge = sorted.filter((_, idx) => idx !== i && idx !== j);
      afterMerge.push(sorted[i] + sorted[j]);
      return isLosing(afterMerge);
    });
  });

  memo.set(key, !hasWinningMove);
  return !hasWinningMove;
};

// Every legal move from a board, in the order the game numbers its piles.
const allMoves = (board: Board): MoveAction[] => {
  const result: MoveAction[] = [];
  board.forEach((_, i) => result.push({ type: 'remove', i }));
  for (let i = 0; i < board.length; i++) {
    for (let j = i + 1; j < board.length; j++) result.push({ type: 'merge', i, j });
  }
  return result;
};

const boardAfter = (board: Board, move: MoveAction): Board => {
  if (move.type === 'remove') {
    const next = board.filter((_, idx) => idx !== move.i);
    if (board[move.i]! > 1) next.push(board[move.i]! - 1);
    return next;
  }
  const next = board.filter((_, idx) => idx !== move.i && idx !== move.j);
  next.push(board[move.i]! + board[move.j]!);
  return next;
};

const asBotMove = (move: MoveAction): BotMove<Moves> =>
  move.type === 'remove'
    ? { move: 'removeOne', args: [move.i] }
    : { move: 'mergePiles', args: [[move.i, move.j]] };

// A move is winning exactly when it hands the opponent a position they lose,
// which `isLosing` answers outright. An earlier version instead picked by the
// parity of sum + pileCount; that is a good rule of thumb but not a theorem —
// it disagrees with the search on boards like [1,2] and [1,1,1], and it lost
// outright from [1,1,1,x] for odd x, all of them reachable from a real start
// board (four piles of two, reduced).
export const smartBotStrategy: Bot = ({ board }) => {
  const candidates = allMoves(board);
  const winning = candidates.filter(move => isLosing(boardAfter(board, move)));
  // Nothing wins against optimal play here, so play on and hope for a slip.
  return asBotMove(sample(winning.length > 0 ? winning : candidates)!);
};

export const randomBotStrategy: Bot = ({ board }) => {
  const winIn1: MoveAction[] = [];
  board.forEach((_, i) => {
    const next = board.filter((_, idx) => idx !== i);
    if (board[i] > 1) next.push(board[i] - 1);
    if (next.length === 0) winIn1.push({ type: 'remove', i });
  });

  const allMoves: MoveAction[] = [];
  board.forEach((_, i) => allMoves.push({ type: 'remove', i }));
  for (let i = 0; i < board.length; i++) {
    for (let j = i + 1; j < board.length; j++) allMoves.push({ type: 'merge', i, j });
  }

  const chosen = sample(winIn1.length > 0 ? winIn1 : allMoves)!;
  if (chosen.type === 'remove') {
    return { move: 'removeOne', args: [chosen.i] };
  } else {
    return { move: 'mergePiles', args: [[chosen.i, chosen.j]] };
  }
};
