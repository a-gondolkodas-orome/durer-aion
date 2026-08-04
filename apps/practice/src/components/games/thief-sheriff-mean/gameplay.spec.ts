import { isCardAvailable, type Board } from './gameplay';

// cards[Sheriff] first, then cards[Thief].
const board: Board = { cards: [[2, 5], [3]], numTurns: 0 };

describe('isCardAvailable', () => {
  it('allows a card no-one is holding yet', () => {
    expect([1, 4, 6, 7].every(index => isCardAvailable(board, 7, index))).toBe(true);
  });

  it("rejects a card either player already holds", () => {
    expect(isCardAvailable(board, 7, 2)).toBe(false); // sheriff's
    expect(isCardAvailable(board, 7, 3)).toBe(false); // thief's
  });

  it('rejects a card outside the deck', () => {
    expect(isCardAvailable(board, 7, 8)).toBe(false);
    expect(isCardAvailable(board, 7, 0)).toBe(false);
    expect(isCardAvailable(board, 7, 1.5)).toBe(false);
  });

  it('follows the deck size it is given', () => {
    // 8 and 9 exist in the nine-card variant but not in the seven-card one
    expect(isCardAvailable(board, 9, 8)).toBe(true);
    expect(isCardAvailable(board, 7, 8)).toBe(false);
  });
});
