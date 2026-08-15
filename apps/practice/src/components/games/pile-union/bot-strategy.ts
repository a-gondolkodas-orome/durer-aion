import { sample, sortBy } from 'lodash';
import type { BotMove, BotStrategy } from 'strategy-game-factory';
import { createWinLossSolver } from '../shared/win-loss-solver';
import type { Board, Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

type MoveAction = { type: 'remove'; i: number } | { type: 'merge'; i: number; j: number }

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

// Both kinds of move strictly lower the pile count or the total, so the game is
// a finite DAG; the last pile removed wins, which is the solver's normal play.
// Piles are interchangeable, so the key sorts them.
const { winningMoves } = createWinLossSolver<Board, MoveAction>({
  key: (board) => sortBy(board).join(','),
  legalMoves: allMoves,
  apply: boardAfter
});

// An earlier version picked by the parity of sum + pileCount instead of
// searching; that is a good rule of thumb but not a theorem — it disagrees with
// the search on boards like [1,2] and [1,1,1], and it lost outright from
// [1,1,1,x] for odd x, all of them reachable from a real start board (four
// piles of two, reduced).
export const smartBotStrategy: Bot = ({ board }) => {
  const winning = winningMoves(board);
  // Nothing wins against optimal play here, so play on and hope for a slip.
  return asBotMove(sample(winning.length > 0 ? winning : allMoves(board))!);
};

export const randomBotStrategy: Bot = ({ board }) => {
  const candidates = allMoves(board);
  const winIn1 = candidates.filter(move => boardAfter(board, move).length === 0);
  return asBotMove(sample(winIn1.length > 0 ? winIn1 : candidates)!);
};
