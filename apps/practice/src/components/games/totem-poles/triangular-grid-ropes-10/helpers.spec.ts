import { isAllowed, type Board } from './helpers';

//    0
//   1 2
//  3 4 5
// 6 7 8 9
const emptyBoard: Board = [];

describe('isAllowed', () => {
  it('allows a rope between neighbouring nodes along a grid line', () => {
    expect(isAllowed(emptyBoard, { from: 0, to: 1 })).toBe(true);
    expect(isAllowed(emptyBoard, { from: 6, to: 7 })).toBe(true);
  });

  it('allows a long rope down a whole side of the triangle', () => {
    expect(isAllowed(emptyBoard, { from: 0, to: 6 })).toBe(true); // through 1 and 3
  });

  it('rejects a pair of nodes not on a common grid line', () => {
    expect(isAllowed(emptyBoard, { from: 0, to: 4 })).toBe(false);
    expect(isAllowed(emptyBoard, { from: 1, to: 5 })).toBe(false);
  });

  it('rejects a rope lying along one already stretched', () => {
    const board: Board = [{ from: 0, to: 1 }];
    expect(isAllowed(board, { from: 0, to: 1 })).toBe(false);
    expect(isAllowed(board, { from: 1, to: 0 })).toBe(false);
  });

  it('rejects a rope passing through a node another rope already occupies', () => {
    const board: Board = [{ from: 3, to: 5 }]; // occupies 3, 4 and 5
    // 1-7 would pass through 4
    expect(isAllowed(board, { from: 1, to: 7 })).toBe(false);
  });

  it('allows a rope that merely ends at an occupied node', () => {
    const board: Board = [{ from: 0, to: 1 }];
    // 1-2 starts where the existing rope ends, but passes through nothing
    expect(isAllowed(board, { from: 1, to: 2 })).toBe(true);
  });

  // The board client asks about the rope the player is halfway through picking,
  // so it hands over an edge with an end still unchosen.
  it('rejects an edge that is missing an end', () => {
    expect(isAllowed(emptyBoard, { from: 0, to: null })).toBe(false);
    expect(isAllowed(emptyBoard, { from: null, to: 1 })).toBe(false);
    expect(isAllowed(emptyBoard, null)).toBe(false);
    expect(isAllowed(emptyBoard)).toBe(false);
  });
});
