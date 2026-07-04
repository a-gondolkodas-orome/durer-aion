import { makeCtx, type GameMoves, type StrategyArgs } from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { type Board, type Coef, hasThreeIntegerRoots, canComplete } from './helpers';

type Strategy = (args: StrategyArgs<Board>) => void;

// Run a bot on a board and capture the single move it makes.
const runWith = (strategy: Strategy) => (board: Board): { coef: Coef; value: number } => {
  let played: { coef: Coef; value: number } | null = null;
  const moves: GameMoves<Board> = {
    setCoefficient: (b: Board, ...args: unknown[]) => {
      const [coef, value] = args as [Coef, number];
      played = { coef, value };
      return { nextBoard: { ...b, [coef]: value } };
    }
  };
  strategy({ board, ctx: makeCtx({ phase: 'play', currentPlayer: 0 }), moves });
  if (!played) throw new Error('bot made no move');
  return played;
};

const runBot = runWith(smartBotStrategy);
const range = (lo: number, hi: number) =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

describe('smartBotStrategy — first player (integer roots)', () => {
  it('opens with a winning first move, using both c = 0 and b = -1 over time', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const { coef, value } = runBot({ a: null, b: null, c: null });
      expect([['c', 0], ['b', -1]].some(([k, v]) => k === coef && v === value)).toBe(true);
      seen.add(`${coef}=${value}`);
    }
    expect(seen).toEqual(new Set(['c=0', 'b=-1']));
  });

  it('completes to three integer roots after a c = 0 opening', () => {
    for (const v of range(-30, 30)) {
      const afterA = runBot({ a: v, b: null, c: 0 });      // opponent set a
      expect(afterA.coef).toBe('b');
      expect(hasThreeIntegerRoots(v, afterA.value, 0)).toBe(true);

      const afterB = runBot({ a: null, b: v, c: 0 });      // opponent set b
      expect(afterB.coef).toBe('a');
      expect(hasThreeIntegerRoots(afterB.value, v, 0)).toBe(true);
    }
  });

  it('completes to three integer roots after a b = -1 opening', () => {
    for (const v of range(-30, 30)) {
      const afterA = runBot({ a: v, b: -1, c: null });      // opponent set a
      expect(afterA.coef).toBe('c');
      expect(hasThreeIntegerRoots(v, -1, afterA.value)).toBe(true);

      const afterC = runBot({ a: null, b: -1, c: v });      // opponent set c
      expect(afterC.coef).toBe('a');
      expect(hasThreeIntegerRoots(afterC.value, -1, v)).toBe(true);
    }
  });
});

describe('smartBotStrategy — second player (prevent)', () => {
  it('blocks every losing first move (anything other than c=0 or b=-1)', () => {
    const blunders: Board[] = [
      ...range(-50, 50).map(a => ({ a, b: null, c: null } as Board)),
      ...range(-50, 50).filter(b => b !== -1).map(b => ({ a: null, b, c: null } as Board)),
      ...range(-50, 50).filter(c => c !== 0).map(c => ({ a: null, b: null, c } as Board))
    ];
    for (const board of blunders) {
      const { coef, value } = runBot(board);
      expect(board[coef]).toBeNull(); // targets an empty coefficient
      const after = { ...board, [coef]: value };
      // The first player can no longer complete to three integer roots.
      expect(canComplete(after)).toBe(false);
    }
  });

  it('blocks large losing first moves too (no cap)', () => {
    const bigBlunders: Board[] = [
      { a: 1000, b: null, c: null },
      { a: -997, b: null, c: null },
      { a: null, b: 1000, c: null },
      { a: null, b: -1000, c: null },
      { a: null, b: null, c: 997 },
      { a: null, b: null, c: -1000 }
    ];
    for (const board of bigBlunders) {
      const { coef, value } = runBot(board);
      const after = { ...board, [coef]: value };
      expect(canComplete(after)).toBe(false);
    }
  });

  it.each([
    { first: { a: null, b: null, c: 0 } as Board, trapCoef: 'b' as Coef },
    { first: { a: null, b: -1, c: null } as Board, trapCoef: 'a' as Coef }
  ])('plays a legal, non-losing trap when the first player sealed the win with $first',
    ({ first, trapCoef }) => {
      const { coef, value } = runBot(first);
      expect(coef).toBe(trapCoef);
      expect(value).not.toBe(0);
      // The move does not throw away the win: the first player can still complete.
      expect(canComplete({ ...first, [coef]: value })).toBe(true);
    });
});

describe('randomBotStrategy (test bot)', () => {
  const runRandom = runWith(randomBotStrategy);

  it('completes to a win on the last move when it can', () => {
    for (let i = 0; i < 20; i++) {
      const { coef, value } = runRandom({ a: 5, b: null, c: 0 });
      expect(coef).toBe('b');
      expect(hasThreeIntegerRoots(5, value, 0)).toBe(true);
    }
  });

  it('always plays a legal integer move on an empty coefficient', () => {
    const boards: Board[] = [
      { a: null, b: null, c: null },
      { a: null, b: null, c: 0 },
      { a: 3, b: null, c: -2 },
      { a: 0, b: null, c: -1 } // last move, no winning completion exists
    ];
    for (const board of boards) {
      for (let i = 0; i < 20; i++) {
        const { coef, value } = runRandom(board);
        expect(board[coef]).toBeNull();
        expect(Number.isInteger(value)).toBe(true);
      }
    }
  });
});
