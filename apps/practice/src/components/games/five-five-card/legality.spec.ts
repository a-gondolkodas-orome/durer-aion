import { isRemovalAllowed, type Board } from './five-five-card';

// Cards are addressed by their 1-based position in the other player's hand.
const board: Board = [
  [1, 2, null, 4, 5],
  [1, 2, 3, 4, 5]
];

describe('isRemovalAllowed', () => {
  it("allows taking a card the other player still holds", () => {
    expect([1, 2, 3, 4, 5].every(id => isRemovalAllowed(board, 1, id))).toBe(true);
  });

  it('rejects a card the other player has already lost', () => {
    expect(isRemovalAllowed(board, 0, 3)).toBe(false);
    expect(isRemovalAllowed(board, 0, 2)).toBe(true);
  });

  it('rejects a position outside the hand, including the 0 of 0-based indexing', () => {
    expect(isRemovalAllowed(board, 1, 0)).toBe(false);
    expect(isRemovalAllowed(board, 1, 6)).toBe(false);
  });
});
