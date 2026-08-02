import { describe, it, expect } from 'vitest';
import { mapValues, uniq, range } from 'lodash';
import { type GameMoves } from '../../strategy-game-factory';
import { makeCtx } from '../../../test-utils';
import { moves as gameMoves, smartBotStrategy } from './ten-coins';

// Exhaustive optimality check for both variants (coin values 1..4 and 1..5).
// Only the SET of distinct present values matters for the game, so we represent
// a position by that set. A move replaces all coins of value K with some L < K.
// You win when only one distinct value remains after your move.
// We verify against an independent minimax that on every winning position the
// bot makes a winning move.

type Vals = number[];

const movesFromSet = (set: Vals): Vals[] => {
  const results: Vals[] = [];
  for (const k of set) {
    for (let l = 1; l < k; l++) {
      results.push(uniq([...set.filter(v => v !== k), l]).sort((a, b) => a - b));
    }
  }
  return results;
};

const winsMemo = new Map<string, boolean>();
const moverWins = (set: Vals): boolean => {
  const key = set.join(',');
  const cached = winsMemo.get(key);
  if (cached !== undefined) return cached;
  winsMemo.set(key, false); // acyclic: every move strictly lowers a value
  const wins = movesFromSet(set).some(r => r.length === 1 || !moverWins(r));
  winsMemo.set(key, wins);
  return wins;
};

const isWinningMove = (result: Vals) => result.length === 1 || !moverWins(result);

const driveBot = (set: Vals): Vals => {
  const board = [...set];
  let captured = board;
  const ctx = makeCtx();
  const wrapped = mapValues(gameMoves, ({ apply }) => (b: number[], ...args: unknown[]) => {
    const res = (apply as (...a: unknown[]) => { nextBoard: number[] })(b, { ctx }, ...args);
    captured = res.nextBoard;
    return res;
  }) as unknown as GameMoves<number[]>;
  smartBotStrategy({ board, ctx, moves: wrapped });
  return uniq(captured).sort((a, b) => a - b);
};

const botCandidates = (set: Vals): Vals[] => {
  const seen = new Map<string, Vals>();
  for (let i = 0; i < 40; i++) {
    const next = driveBot(set);
    seen.set(next.join(','), next);
  }
  return [...seen.values()];
};

// All non-empty subsets of {1..maxValue} with at least two distinct values.
const subsets = (maxValue: number): Vals[] => {
  const values = range(1, maxValue + 1);
  const out: Vals[] = [];
  for (let mask = 1; mask < 1 << values.length; mask++) {
    const s = values.filter((_, i) => mask & (1 << i));
    if (s.length >= 2) out.push(s);
  }
  return out;
};

describe('ten-coins smart bot is optimal for both variants', () => {
  for (const maxValue of [4, 5]) {
    it(`plays optimally for coin values 1..${maxValue}`, () => {
      for (const set of subsets(maxValue)) {
        if (!moverWins(set)) continue; // bot on the losing side: no win to protect
        for (const next of botCandidates(set)) {
          expect(isWinningMove(next), `bot blundered from {${set}} to {${next}}`).toBe(true);
        }
      }
    });
  }
});
