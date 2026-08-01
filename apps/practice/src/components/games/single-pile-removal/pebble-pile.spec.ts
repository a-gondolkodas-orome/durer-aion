import { cap, validateTake, type Board } from './pebble-pile';

const isTakeAllowed = (board: Board, count: number) => validateTake(board, undefined, count);

describe('pebble-pile shared take legality', () => {
  describe('cap', () => {
    it('is the per-turn maximum while the pile is larger', () => {
      expect(cap({ stones: 10, maxTake: 4 })).toBe(4);
    });

    it('is the pile size once fewer pebbles remain than the maximum', () => {
      expect(cap({ stones: 3, maxTake: 7 })).toBe(3);
    });
  });

  describe('validateTake', () => {
    it('allows any count between one and the cap', () => {
      const board: Board = { stones: 10, maxTake: 4 };
      expect([1, 2, 3, 4].every(count => isTakeAllowed(board, count))).toBe(true);
    });

    it('rejects taking more than the cap', () => {
      expect(isTakeAllowed({ stones: 10, maxTake: 4 }, 5)).toBe(false);
    });

    it('rejects taking more pebbles than the pile holds', () => {
      expect(isTakeAllowed({ stones: 3, maxTake: 7 }, 4)).toBe(false);
    });

    it('allows clearing a pile smaller than the cap', () => {
      expect(isTakeAllowed({ stones: 3, maxTake: 7 }, 3)).toBe(true);
    });

    it('rejects taking nothing or a negative amount', () => {
      const board: Board = { stones: 10, maxTake: 4 };
      expect(isTakeAllowed(board, 0)).toBe(false);
      expect(isTakeAllowed(board, -1)).toBe(false);
    });

    it('rejects non-integer counts', () => {
      expect(isTakeAllowed({ stones: 10, maxTake: 4 }, 1.5)).toBe(false);
      expect(isTakeAllowed({ stones: 10, maxTake: 4 }, NaN)).toBe(false);
    });
  });
});
