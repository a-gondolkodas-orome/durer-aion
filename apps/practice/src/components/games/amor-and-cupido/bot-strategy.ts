import { sample } from 'lodash';
import type { StrategyArgs } from '../../game-factory';
import {
  type Board, getAllowedMoves, completesTriangle, canonicalKey
} from './helpers';

// Game value of a position, memoised by canonical (isomorphism-reduced) key.
// Shared across calls/tests: the value depends only on the position and who is
// to move, so earlier results stay valid. There are no draws (Ramsey: every
// 2-colouring of K6 has a monochromatic triangle), so the value is +1 (the
// player to move can force a win) or -1 (they lose).
const memo = new Map<string, number>();

const negamax = (board: Board, toMove: number): number => {
  const empties = getAllowedMoves(board);
  // A full board with no prior win is impossible (Ramsey); defensive fallback.
  if (empties.length === 0) return -1;

  const key = canonicalKey(board, toMove);
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let best = -1;
  for (const e of empties) {
    let value: number;
    if (completesTriangle(board, toMove, e)) {
      value = 1;
    } else {
      const next = board.slice();
      next[e] = toMove;
      value = -negamax(next, 1 - toMove);
    }
    if (value === 1) { best = 1; break; }
  }

  memo.set(key, best);
  return best;
};

export const getBotScore = (board: Board, toMove: number): number => negamax(board, toMove);

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const me = ctx.currentPlayer!;
  const empties = getAllowedMoves(board);

  // 1. Take an immediate winning move if one exists.
  const winningNow = empties.filter(e => completesTriangle(board, me, e));
  if (winningNow.length > 0) {
    moves.claimEdge(board, sample(winningNow)!);
    return;
  }

  // 2. Forced-win moves: after playing them, the opponent is in a losing
  //    position. With optimal play the first player always has these.
  const forcedWin = empties.filter(e => {
    const next = board.slice();
    next[e] = me;
    return negamax(next, 1 - me) === -1;
  });
  if (forcedWin.length > 0) {
    moves.claimEdge(board, sample(forcedWin)!);
    return;
  }

  // 3. Losing position: the opponent can force a win with perfect play, so the
  //    bot plays to drag the game out and maximise the chance of a mistake.
  //    First, never hand over an immediate (1-move) win that could be blocked;
  //    then, among those moves, leave the opponent the fewest winning replies
  //    (the narrowest path to their win, so they are likeliest to slip).
  const opponent = 1 - me;

  const allowsImmediateWin = (e: number): boolean => {
    const next = board.slice();
    next[e] = me;
    return getAllowedMoves(next).some(r => completesTriangle(next, opponent, r));
  };
  // If two threats exist at once, the loss is unavoidable next turn anyway.
  const safeMoves = empties.filter(e => !allowsImmediateWin(e));
  const candidates = safeMoves.length > 0 ? safeMoves : empties;

  const opponentWinningReplies = (e: number): number => {
    const next = board.slice();
    next[e] = me;
    return getAllowedMoves(next).filter(r => {
      if (completesTriangle(next, opponent, r)) return true; // opponent wins on the spot
      const after = next.slice();
      after[r] = opponent;
      return negamax(after, me) === -1; // opponent stays in a winning position
    }).length;
  };
  const scores = candidates.map(opponentWinningReplies);
  const fewest = Math.min(...scores);
  const bestMoves = candidates.filter((_, i) => scores[i] === fewest);
  moves.claimEdge(board, sample(bestMoves)!);
};
