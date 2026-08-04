import { describe, it, expect } from 'vitest';
import { uniq, range } from 'lodash';
import { playBotMove } from '../../../test-utils';
import { smartBotStrategy } from './ten-coins';
import { moves as gameMoves } from './gameplay';

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

const driveBot = (set: Vals): Vals =>
  uniq(playBotMove(smartBotStrategy, gameMoves, [...set])).sort((a, b) => a - b);

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

const botCandidates = (set: Vals): Vals[] => {
  const seen = new Map<string, Vals>();
  for (let i = 0; i < 40; i++) {
    const next = driveBot(set);
    seen.set(next.join(','), next);
  }
  return [...seen.values()];
};

const isWinningMove = (result: Vals) => result.length === 1 || !moverWins(result);

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
