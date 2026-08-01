import { distance, sideLength, isSharkMoveAllowed, isSubmarineMoveAllowed } from './helpers';

// The 4 × 4 lake, sectors numbered row by row:
//   0  1  2  3
//   4  5  6  7
//   8  9 10 11
//  12 13 14 15
const lake4 = (over = {}) => ({
  submarines: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  shark: 5,
  turn: 1,
  sharkMovesInTurn: 0,
  ...over
});

// The 5 × 5 lake, numbered the same way — so the rows break in different places:
//   0  1  2  3  4
//   5  6  7  8  9
//  10 11 12 13 14
//  15 16 17 18 19
//  20 21 22 23 24
const lake5 = (over = {}) => ({
  submarines: [0, 0, 1, ...Array(22).fill(0)],
  shark: 6,
  turn: 1,
  sharkMovesInTurn: 0,
  ...over
});

describe('sideLength', () => {
  it('reads the side of the lake off the sector count', () => {
    expect(sideLength(lake4())).toBe(4);
    expect(sideLength(lake5())).toBe(5);
  });
});

describe('distance', () => {
  it('is the Manhattan distance of the two sectors', () => {
    expect(distance(0, 1, 4)).toBe(1); // side by side
    expect(distance(0, 4, 4)).toBe(1); // one above the other
    expect(distance(0, 5, 4)).toBe(2); // diagonal
    expect(distance(0, 15, 4)).toBe(6); // opposite corners
  });

  it('does not wrap around the edge of the lake', () => {
    // 3 and 4 are adjacent as numbers but sit in different rows, far apart
    expect(distance(3, 4, 4)).toBe(4);
  });

  it('reads the same sector numbers differently on a wider lake', () => {
    // The first row runs to 4 here, so 3 and 4 are side by side and 5 is the
    // sector directly below 0.
    expect(distance(3, 4, 5)).toBe(1);
    expect(distance(0, 5, 5)).toBe(1);
    expect(distance(0, 4, 5)).toBe(4);
  });
});

describe('isSubmarineMoveAllowed', () => {
  it('allows a submarine to swim into a side-adjacent sector', () => {
    expect(isSubmarineMoveAllowed(lake4(), 2, 1)).toBe(true);
    expect(isSubmarineMoveAllowed(lake4(), 2, 6)).toBe(true);
  });

  it('rejects a diagonal move', () => {
    expect(isSubmarineMoveAllowed(lake4(), 2, 5)).toBe(false);
  });

  it('rejects staying put', () => {
    expect(isSubmarineMoveAllowed(lake4(), 2, 2)).toBe(false);
  });

  it('rejects moving from a sector holding no submarine', () => {
    expect(isSubmarineMoveAllowed(lake4(), 0, 1)).toBe(false);
  });

  it('rejects a move off the edge of the lake', () => {
    // 3 is the end of the top row; 4 starts the next one
    expect(isSubmarineMoveAllowed(lake4({ submarines: [0, 0, 0, 1, ...Array(12).fill(0)] }), 3, 4))
      .toBe(false);
    expect(isSubmarineMoveAllowed(lake4(), 2, 16)).toBe(false);
  });

  it('follows the wider rows of the 5 × 5 lake', () => {
    const board = lake5({ submarines: [0, 0, 0, 1, ...Array(21).fill(0)] });
    // 3 → 4 stays inside the first row here, unlike on the 4 × 4 lake
    expect(isSubmarineMoveAllowed(board, 3, 4)).toBe(true);
    // and the sector below 3 is 8, not 7
    expect(isSubmarineMoveAllowed(board, 3, 8)).toBe(true);
    expect(isSubmarineMoveAllowed(board, 3, 7)).toBe(false);
  });
});

describe('isSharkMoveAllowed', () => {
  it('allows the shark to swim into a side-adjacent sector', () => {
    expect([1, 4, 6, 9].every(to => isSharkMoveAllowed(lake4(), to))).toBe(true);
  });

  it('allows the shark to stay put, giving up the rest of its night', () => {
    expect(isSharkMoveAllowed(lake4(), 5)).toBe(true);
  });

  it('rejects a diagonal or longer move', () => {
    expect(isSharkMoveAllowed(lake4(), 0)).toBe(false);
    expect(isSharkMoveAllowed(lake4(), 13)).toBe(false);
  });

  it('rejects a sector outside the lake', () => {
    expect(isSharkMoveAllowed(lake4(), 16)).toBe(false);
    expect(isSharkMoveAllowed(lake4(), -1)).toBe(false);
  });

  it('follows the wider rows of the 5 × 5 lake', () => {
    // From 6 the shark's neighbours are 1, 5, 7 and 11 — a row further apart
    // than on the 4 × 4 lake, where 6 borders 2, 5, 7 and 10.
    expect([1, 5, 7, 11].every(to => isSharkMoveAllowed(lake5(), to))).toBe(true);
    expect(isSharkMoveAllowed(lake5(), 2)).toBe(false);
    expect(isSharkMoveAllowed(lake5(), 10)).toBe(false);
  });

  it('counts sector 16 as part of the 5 × 5 lake, unlike the 4 × 4 one', () => {
    expect(isSharkMoveAllowed(lake4({ shark: 15 }), 16)).toBe(false); // outside the lake
    expect(isSharkMoveAllowed(lake5({ shark: 11 }), 16)).toBe(true);
  });
});
