import { emptiedPileId, isRemovalAllowed, isSplitAllowed, withPileRemoved } from './gameplay';

describe('pile-splitting shared turn legality', () => {
  describe('emptiedPileId', () => {
    it('is undefined at the start of a turn, when every pile stands', () => {
      expect(emptiedPileId([5, 3, 4])).toBe(undefined);
    });

    it('is the slot emptied by the removal half of the turn', () => {
      expect(emptiedPileId([5, 0, 4])).toBe(1);
    });
  });

  describe('isRemovalAllowed', () => {
    it('allows removing a pile while another one can still be split', () => {
      expect(isRemovalAllowed([5, 3, 4], 0)).toBe(true);
    });

    it('rejects a removal that would leave nothing splittable', () => {
      // only pile 2 has 2+ pieces, so it is the one that must be split
      expect(isRemovalAllowed([1, 1, 4], 2)).toBe(false);
      expect(isRemovalAllowed([1, 1, 4], 0)).toBe(true);
    });

    it('rejects a second removal in the same turn', () => {
      expect(isRemovalAllowed([5, 0, 4], 2)).toBe(false);
    });

    it('rejects a pile id outside the board', () => {
      expect(isRemovalAllowed([5, 3, 4], 3)).toBe(false);
      expect(isRemovalAllowed([5, 3, 4], -1)).toBe(false);
    });
  });

  describe('isSplitAllowed', () => {
    it('allows any split leaving both halves non-empty', () => {
      expect([1, 2, 3].every(pieceCount => isSplitAllowed([0, 3, 4], 2, pieceCount))).toBe(true);
    });

    it('rejects a split that would leave a half empty', () => {
      expect(isSplitAllowed([0, 3, 4], 2, 0)).toBe(false);
      expect(isSplitAllowed([0, 3, 4], 2, 4)).toBe(false);
    });

    it('rejects splitting before a pile has been removed this turn', () => {
      expect(isSplitAllowed([5, 3, 4], 2, 2)).toBe(false);
    });

    it('rejects splitting the pile that was just removed', () => {
      expect(isSplitAllowed([0, 3, 4], 0, 1)).toBe(false);
    });

    it('rejects a non-integer piece count', () => {
      expect(isSplitAllowed([0, 3, 4], 2, 1.5)).toBe(false);
    });
  });

  describe('withPileRemoved', () => {
    it('empties the removed pile and leaves the others untouched', () => {
      expect(withPileRemoved([5, 3, 4], 1)).toEqual([5, 0, 4]);
    });

    it('does not mutate the board it is given', () => {
      const board = [5, 3, 4];
      withPileRemoved(board, 1);
      expect(board).toEqual([5, 3, 4]);
    });
  });
});
