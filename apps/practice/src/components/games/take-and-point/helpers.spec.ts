import { describe, it, expect } from 'vitest';
import {
  applyRemoval,
  countMinPiles,
  generateStartBoard,
  isTerminal,
  minPileSize,
  nonEmptyIndices,
  removerWins
} from './helpers';

// Brute-force ground truth: does the player who is about to be pointed at (and
// then takes) win the rest of the game with optimal play from both sides?
const cache = new Map<string, boolean>();
const nextTakerWins = (piles: number[]): boolean => {
  const live = piles.filter(p => p > 0).sort((a, b) => a - b);
  const key = live.join(',');
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const indices = live.map((_, i) => i);
  // The pointer (adversary) picks the pointing; they win if ANY pointing stops
  // the taker. A pointing is 2 distinct piles, or the single pile if only one.
  const pointings: number[][] = indices.length === 1
    ? [[0]]
    : indices.flatMap((a, i) => indices.slice(i + 1).map(b => [a, b]));

  let takerWins = true;
  for (const pointing of pointings) {
    let takerCanWin = false;
    for (const idx of pointing) {
      for (let amount = 1; amount <= live[idx]; amount++) {
        const next = applyRemoval(live, idx, amount);
        if (next.every(p => p === 0)) {
          takerCanWin = true; // taker grabs the last stone
        } else if (!nextTakerWins(next)) {
          takerCanWin = true; // taker leaves opponent in a losing spot
        }
        if (takerCanWin) break;
      }
      if (takerCanWin) break;
    }
    if (!takerCanWin) { takerWins = false; break; }
  }

  cache.set(key, takerWins);
  return takerWins;
};

const enumeratePiles = (maxPiles: number, maxSize: number): number[][] => {
  const result: number[][] = [];
  const recurse = (current: number[], minNext: number) => {
    if (current.length >= 1) result.push([...current]);
    if (current.length === maxPiles) return;
    for (let s = minNext; s <= maxSize; s++) recurse([...current, s], s);
  };
  recurse([], 1);
  return result;
};

describe('take-and-point characterisation', () => {
  it('matches brute-force minimax: winning iff the smallest pile size occurs an odd number of times', () => {
    for (const piles of enumeratePiles(5, 6)) {
      expect(removerWins(piles)).toBe(nextTakerWins(piles));
    }
  });
});

describe('helpers', () => {
  it('minPileSize / countMinPiles ignore empty piles', () => {
    expect(minPileSize([0, 3, 2, 2])).toBe(2);
    expect(countMinPiles([0, 3, 2, 2])).toBe(2);
    expect(removerWins([0, 3, 2, 2])).toBe(false);
    expect(removerWins([0, 3, 2, 2, 2])).toBe(true);
  });

  it('applyRemoval only changes the targeted pile', () => {
    expect(applyRemoval([4, 2, 5], 0, 3)).toEqual([1, 2, 5]);
    expect(applyRemoval([4, 2, 5], 2, 5)).toEqual([4, 2, 0]);
  });

  it('nonEmptyIndices / isTerminal', () => {
    expect(nonEmptyIndices([0, 3, 0, 2])).toEqual([1, 3]);
    expect(isTerminal({ piles: [0, 0, 0], pointed: null })).toBe(true);
    expect(isTerminal({ piles: [0, 1, 0], pointed: null })).toBe(false);
  });

  it('generateStartBoard yields a playable, balanced position', () => {
    let odd = 0;
    const samples = 400;
    for (let n = 0; n < samples; n++) {
      const { piles, pointed } = generateStartBoard();
      expect(pointed).toBeNull();
      expect(nonEmptyIndices(piles).length).toBeGreaterThanOrEqual(3);
      expect(piles.every(p => p >= 1 && p <= 6)).toBe(true);
      if (removerWins(piles)) odd++;
    }
    // Roughly 50/50 between the two roles.
    expect(odd / samples).toBeGreaterThan(0.3);
    expect(odd / samples).toBeLessThan(0.7);
  });
});
