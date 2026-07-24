import { sample, random } from 'lodash';
import type { StrategyArgs } from '../../strategy-game-factory';
import {
  type Board, type Grid, getRectangles, getAllMoves, applyMove, isEmpty
} from './helpers';

// Sprague–Grundy value of a single a×b rectangle. A move removes a full row
// (splitting a×b into (i-1)×b and (a-i)×b) or a full column (a×(j-1) and
// a×(b-j)); the value is the mex of the XORs of the resulting positions.
// It comes out to 0 exactly when both a and b are even — the official result.
const memo = new Map<string, number>();
export const grundy = (a: number, b: number): number => {
  if (a === 0 || b === 0) return 0;
  if (a > b) [a, b] = [b, a];
  const key = `${a},${b}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const reachable = new Set<number>();
  for (let i = 1; i <= a; i++) reachable.add(grundy(i - 1, b) ^ grundy(a - i, b));
  for (let j = 1; j <= b; j++) reachable.add(grundy(a, j - 1) ^ grundy(a, b - j));
  let mex = 0;
  while (reachable.has(mex)) mex++;
  memo.set(key, mex);
  return mex;
};

// The board is a disjunctive sum of independent rectangles: XOR their values.
export const boardGrundy = (grid: Grid): number =>
  getRectangles(grid).reduce(
    (acc, r) => acc ^ grundy(r.maxR - r.minR + 1, r.maxC - r.minC + 1),
    0
  );

// From a lost position the game is decided, so occasionally concede fast (hand
// the opponent an instant win) instead of dragging it out. 1 in 4 ≈ 25%.
const CONCEDE_ODDS = 4;

// Optimal play: from a winning position (non-zero Grundy) move to a 0 position;
// such a move always exists. From a losing position every move hands the
// opponent a win, so — unless we concede — play for a mistake: keep the game
// going (no instant win for the opponent, e.g. never collapse to a lone 1×n
// line) and leave them as few winning replies as possible.
export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const { grid } = board;
  const allMoves = getAllMoves(grid);
  const winning = allMoves.filter(m => boardGrundy(applyMove(grid, m)) === 0);

  let choice: typeof allMoves[number];
  if (winning.length) {
    choice = sample(winning)!;
  } else {
    const scored = allMoves.map(m => {
      const next = applyMove(grid, m);
      const replies = getAllMoves(next);
      return {
        m,
        // whether the opponent could take the last disc right away
        givesInstantWin: replies.some(r => isEmpty(applyMove(next, r))),
        winningReplies: replies.filter(r => boardGrundy(applyMove(next, r)) === 0).length
      };
    });
    const concede = scored.filter(s => s.givesInstantWin);
    const keepAlive = scored.filter(s => !s.givesInstantWin);

    if (concede.length && (!keepAlive.length || random(1, CONCEDE_ODDS) === 1)) {
      choice = sample(concede)!.m;
    } else {
      const fewest = Math.min(...keepAlive.map(s => s.winningReplies));
      choice = sample(keepAlive.filter(s => s.winningReplies === fewest))!.m;
    }
  }
  moves.removeLine(board, choice);
};

// Test bot: random legal move, but grabs an immediate win (last disc) if offered.
export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const { grid } = board;
  const allMoves = getAllMoves(grid);
  const winningNow = allMoves.filter(m => isEmpty(applyMove(grid, m)));
  moves.removeLine(board, sample(winningNow.length ? winningNow : allMoves)!);
};
