import { describe, it, expect } from 'vitest';
import { uniq, range } from 'lodash';
import { playBotMove } from '../../../test-utils';
import { isConversionAllowed, moves as gameMoves, smartBotStrategy } from './ten-coins';

describe('isConversionAllowed', () => {
  // Four 3s and six 1s: the values 1 and 3 are on the table, 2 and 4 are not.
  const board = [1, 1, 1, 1, 1, 1, 3, 3, 3, 3];

  it('accepts a value on the table turned into any smaller one', () => {
    expect(isConversionAllowed(board, 3, 1)).toBe(true);
    expect(isConversionAllowed(board, 3, 2)).toBe(true);
  });

  it('refuses a value that is not on the table', () => {
    expect(isConversionAllowed(board, 2, 1)).toBe(false);
    expect(isConversionAllowed(board, 4, 1)).toBe(false);
  });

  it('refuses a target that is not strictly smaller', () => {
    expect(isConversionAllowed(board, 3, 3)).toBe(false);
    expect(isConversionAllowed(board, 3, 4)).toBe(false);
  });

  it('refuses value-1 coins, which have no smaller value to become', () => {
    expect(isConversionAllowed(board, 1, 1)).toBe(false);
    expect(isConversionAllowed(board, 1, 0)).toBe(false);
  });

  it('refuses non-integer or non-positive arguments', () => {
    expect(isConversionAllowed(board, 3, 0)).toBe(false);
    expect(isConversionAllowed(board, 3, -1)).toBe(false);
    expect(isConversionAllowed(board, 3, 1.5)).toBe(false);
  });
});

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

const driveBot = (set: Vals): Vals =>
  uniq(playBotMove(smartBotStrategy, gameMoves, [...set])).sort((a, b) => a - b);

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
