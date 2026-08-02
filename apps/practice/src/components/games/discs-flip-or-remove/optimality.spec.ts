import { describe, it, expect } from 'vitest';
import { mapValues } from 'lodash';
import { dummyEvents, type GameMoves } from '../../strategy-game-factory';
import { makeCtx } from '../../../test-utils';
import { moves as gameMoves, smartBotStrategy } from './discs-flip-or-remove';

// Exhaustive optimality check for both variants (max 6 and max 10 discs).
// Board = [blue, red]. Moves: remove 1-2 blue, or flip 1-2 red into blue.
// A player who cannot move (board [0,0]) loses. We verify against an
// independent minimax over the whole reachable state space that the bot,
// whenever the mover can win, always moves to a losing-for-opponent position.

type Board = [number, number];

const key = ([b, r]: Board) => `${b},${r}`;

const legalMoves = ([blue, red]: Board): Board[] => {
  const next: Board[] = [];
  if (blue >= 1) next.push([blue - 1, red]);
  if (blue >= 2) next.push([blue - 2, red]);
  if (red >= 1) next.push([blue + 1, red - 1]);
  if (red >= 2) next.push([blue + 2, red - 2]);
  return next;
};

const moverWinsMemo = new Map<string, boolean>();
const moverWins = (board: Board): boolean => {
  const k = key(board);
  const cached = moverWinsMemo.get(k);
  if (cached !== undefined) return cached;
  moverWinsMemo.set(k, false); // guard against cycles (there are none: total is non-increasing)
  const wins = legalMoves(board).some(m => !moverWins(m));
  moverWinsMemo.set(k, wins);
  return wins;
};

const driveBot = (board: Board): Board => {
  let captured: Board = board;
  const ctx = makeCtx();
  // Long-form moves ({ validate, legacyApply }) expose their effect as `legacyApply`.
  const wrapped = mapValues(gameMoves, ({ legacyApply }) => (b: Board, ...args: unknown[]) => {
    const res = (legacyApply as (...a: unknown[]) => { nextBoard: Board })(b, { ctx, events: dummyEvents }, ...args);
    captured = res.nextBoard;
    return res;
  }) as unknown as GameMoves<Board>;
  smartBotStrategy({ board, ctx, moves: wrapped });
  return captured;
};

const botCandidates = (board: Board): Board[] => {
  const seen = new Map<string, Board>();
  for (let i = 0; i < 40; i++) {
    const next = driveBot(board);
    seen.set(key(next), next);
  }
  return [...seen.values()];
};

describe('discs-flip-or-remove smart bot is optimal for both variants', () => {
  for (const max of [6, 10]) {
    it(`plays optimally across every position with up to ${max} discs`, () => {
      for (let blue = 0; blue <= max; blue++) {
        for (let red = 0; red + blue <= max; red++) {
          const board: Board = [blue, red];

          // The game value is exactly "blue is not a multiple of 3".
          expect(moverWins(board), `game value at ${key(board)}`).toBe(blue % 3 !== 0);

          if (!moverWins(board)) continue; // bot on the losing side: no win to protect
          for (const next of botCandidates(board)) {
            const isLegal = legalMoves(board).some(m => key(m) === key(next));
            expect(isLegal, `${key(next)} legal from ${key(board)}`).toBe(true);
            expect(moverWins(next), `bot blundered from ${key(board)} to ${key(next)}`).toBe(false);
          }
        }
      }
    });
  }
});
