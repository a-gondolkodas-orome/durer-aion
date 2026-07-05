import { describe, it, expect } from 'vitest';
import { sample } from 'lodash';
import { chooseRemoval, choosePointing } from './bot-strategy';
import {
  applyRemoval,
  countMinPiles,
  minPileSize,
  nonEmptyIndices,
  removerWins
} from './helpers';

// ---- brute-force oracle (independent of the bot) ----
const cache = new Map<string, boolean>();
const nextTakerWins = (piles: number[]): boolean => {
  const live = piles.filter(p => p > 0).sort((a, b) => a - b);
  const key = live.join(',');
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const idx = live.map((_, i) => i);
  const pointings: number[][] = idx.length === 1
    ? [[0]]
    : idx.flatMap((a, i) => idx.slice(i + 1).map(b => [a, b]));

  let win = true;
  for (const pointing of pointings) {
    let takerCanWin = false;
    for (const i of pointing) {
      for (let amount = 1; amount <= live[i] && !takerCanWin; amount++) {
        const next = applyRemoval(live, i, amount);
        if (next.every(p => p === 0) || !nextTakerWins(next)) takerCanWin = true;
      }
    }
    if (!takerCanWin) { win = false; break; }
  }
  cache.set(key, win);
  return win;
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

const validPointings = (piles: number[]): number[][] => {
  const idx = nonEmptyIndices(piles);
  if (idx.length === 1) return [[idx[0]]];
  return idx.flatMap((a, i) => idx.slice(i + 1).map(b => [a, b]));
};

const allStates = enumeratePiles(5, 6);

describe('smart bot — removal from a winning position', () => {
  it('always makes a legal move that leaves the opponent losing (or wins outright)', () => {
    for (const piles of allStates) {
      if (!removerWins(piles)) continue;
      for (const pointed of validPointings(piles)) {
        const { index, amount } = chooseRemoval({ piles, pointed });
        expect(pointed).toContain(index);
        expect(amount).toBeGreaterThanOrEqual(1);
        expect(amount).toBeLessThanOrEqual(piles[index]);

        const result = applyRemoval(piles, index, amount);
        if (result.some(p => p > 0)) {
          // Opponent is now the remover and must be in a losing position.
          expect(removerWins(result)).toBe(false);
        }
      }
    }
  });
});

describe('smart bot — pointing at a losing opponent', () => {
  it('points at two smallest piles so every opponent reply stays winning for us', () => {
    for (const piles of allStates) {
      if (nonEmptyIndices(piles).length < 2) continue;
      if (countMinPiles(piles) % 2 !== 0) continue; // only when the opponent is losing

      const pointing = choosePointing({ piles, pointed: null });
      const k = minPileSize(piles);
      expect(pointing).toHaveLength(2);
      pointing.forEach(i => expect(piles[i]).toBe(k));

      for (const i of pointing) {
        for (let amount = 1; amount <= piles[i]; amount++) {
          const result = applyRemoval(piles, i, amount);
          // With >= 2 minimal piles, removing from one never empties the board.
          expect(result.some(p => p > 0)).toBe(true);
          expect(removerWins(result)).toBe(true);
        }
      }
    }
  });
});

describe('choosePointing legality', () => {
  it('points at the required number of distinct non-empty piles', () => {
    for (const piles of allStates) {
      const nonEmpty = nonEmptyIndices(piles);
      const pointing = choosePointing({ piles, pointed: null });
      const required = nonEmpty.length === 1 ? 1 : 2;
      expect(pointing).toHaveLength(required);
      expect(new Set(pointing).size).toBe(required);
      pointing.forEach(i => expect(piles[i]).toBeGreaterThan(0));
    }
  });
});

// ---- full-game simulation against a perfect adversary ----
const perfectRemoval = (piles: number[], pointed: number[]) => {
  const wins = pointed.flatMap(index =>
    Array.from({ length: piles[index] }, (_, k) => ({ index, amount: k + 1 }))
  ).filter(({ index, amount }) => {
    const next = applyRemoval(piles, index, amount);
    return next.every(p => p === 0) || !nextTakerWins(next);
  });
  if (wins.length) return sample(wins)!;
  return { index: pointed[0], amount: 1 };
};

const perfectPointing = (piles: number[]): number[] => {
  const good = validPointings(piles).filter(pointing =>
    pointing.every(i => {
      for (let amount = 1; amount <= piles[i]; amount++) {
        const next = applyRemoval(piles, i, amount);
        if (next.every(p => p === 0) || !nextTakerWins(next)) return false;
      }
      return true;
    })
  );
  return sample(good.length ? good : validPointings(piles))!;
};

// One engine turn: current player takes (if pointed), then points for the other.
const playTurn = (
  state: { piles: number[]; pointed: number[] | null; current: number },
  strategies: [
    { removal: (p: number[], pt: number[]) => { index: number; amount: number }; pointing: (p: number[]) => number[] },
    { removal: (p: number[], pt: number[]) => { index: number; amount: number }; pointing: (p: number[]) => number[] }
  ]
): { piles: number[]; pointed: number[] | null; current: number } | { winner: number } => {
  const s = strategies[state.current];
  let piles = state.piles;
  if (state.pointed !== null) {
    const { index, amount } = s.removal(piles, state.pointed);
    piles = applyRemoval(piles, index, amount);
    if (piles.every(p => p === 0)) return { winner: state.current };
  }
  return { piles, pointed: s.pointing(piles), current: 1 - state.current };
};

const smart = {
  removal: (piles: number[], pointed: number[]) => chooseRemoval({ piles, pointed }),
  pointing: (piles: number[]) => choosePointing({ piles, pointed: null })
};
const perfect = {
  removal: (piles: number[], pointed: number[]) => perfectRemoval(piles, pointed),
  pointing: (piles: number[]) => perfectPointing(piles)
};

const playGame = (startPiles: number[], botSide: number): number => {
  const strategies: [typeof smart, typeof smart] = botSide === 0 ? [smart, perfect] : [perfect, smart];
  let state: { piles: number[]; pointed: number[] | null; current: number } =
    { piles: startPiles, pointed: null, current: 0 };
  for (let guard = 0; guard < 1000; guard++) {
    const result = playTurn(state, strategies as any);
    if ('winner' in result) return result.winner;
    state = result;
  }
  throw new Error('game did not terminate');
};

describe('smart bot wins every game it should, against a perfect adversary', () => {
  it('wins from every winning start position (bot as the side that should win)', () => {
    for (const piles of enumeratePiles(4, 5)) {
      if (nonEmptyIndices(piles).length < 2) continue;
      // Player 0 points first; player 1 is the first taker. The first taker wins
      // iff the start is a winning (odd-minimal-count) position.
      const botSide = removerWins(piles) ? 1 : 0;
      // repeat: perfect adversary and bot tie-break randomly, so sample lines
      for (let rep = 0; rep < 5; rep++) {
        expect(playGame([...piles], botSide)).toBe(botSide);
      }
    }
  });
});
