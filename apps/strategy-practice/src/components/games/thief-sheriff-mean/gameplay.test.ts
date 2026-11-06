import { hasWinningTriple, isCardAvailable, type Board } from './gameplay';

// cards[Sheriff] first, then cards[Thief].
const board: Board = { cards: [[2, 5], [3]], numTurns: 0 };

describe('isCardAvailable', () => {
  it('allows a card no-one is holding yet', () => {
    expect([1, 4, 6, 7].every(index => isCardAvailable(board, 7, index))).toBe(true);
  });

  it('rejects a card either player already holds', () => {
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

// The whole rule turns on this: the thief wins by holding three cards where one
// number is the average of the other two — equivalently, three in arithmetic
// progression, in any order.
describe('hasWinningTriple', () => {
  it('finds three cards in arithmetic progression', () => {
    expect(hasWinningTriple([1, 2, 3])).toBe(true);
    expect(hasWinningTriple([1, 5, 9])).toBe(true);
    expect(hasWinningTriple([2, 6, 4])).toBe(true); // 4 is the average of 2 and 6
  });

  it('does not care what order the cards were collected in', () => {
    expect(hasWinningTriple([9, 1, 5])).toBe(true);
    expect(hasWinningTriple([5, 9, 1])).toBe(true);
  });

  it('finds a triple hidden among other cards', () => {
    // 3, 5, 7 is the progression; 2 and 8 are noise
    expect(hasWinningTriple([2, 3, 5, 7, 8])).toBe(true);
  });

  it('rejects a hand with no such triple', () => {
    expect(hasWinningTriple([1, 2, 4])).toBe(false);
    // none of {1,2,6}, {1,2,7}, {1,6,7}, {2,6,7} is a progression
    expect(hasWinningTriple([1, 2, 6, 7])).toBe(false);
  });

  it('needs three cards — a pair is never enough', () => {
    expect(hasWinningTriple([])).toBe(false);
    expect(hasWinningTriple([5])).toBe(false);
    expect(hasWinningTriple([2, 4])).toBe(false);
  });

  it('needs three *different* cards, not one used twice', () => {
    // 2 and 6 average to 4, but the hand has no 4 to hold
    expect(hasWinningTriple([2, 6])).toBe(false);
  });
});
