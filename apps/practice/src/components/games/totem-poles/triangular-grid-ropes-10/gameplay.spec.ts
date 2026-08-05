import { isAllowed, moves, type Board } from './gameplay';
import { makeCtx } from '../../../../test-utils';

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

  it('rejects a rope from a pole to itself', () => {
    // A vertex shares all three coordinates with itself and spans no middle
    // point, so nothing else in `isAllowed` rules this out.
    expect(isAllowed(emptyBoard, { from: 3, to: 3 })).toBe(false);
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

// A rope may not pass a pole another rope already touches, so the grid runs out
// of legal ropes on its own; the player who stretches the last one wins.
//
//    0
//   1 2
//  3 4 5
// 6 7 8 9
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// Ropes may share an endpoint — only the poles a rope passes *by* must be free —
// so the grid does not run out until it is saturated. This recorded game is the
// shortest ending found, at eleven ropes.
const RECORDED_GAME = [
  [6, 9], [0, 9], [0, 6], [2, 1], [3, 5], [8, 5],
  [7, 4], [4, 1], [4, 2], [7, 3], [8, 4]
].map(([from, to]) => ({ from, to }));

const lastRope = RECORDED_GAME[RECORDED_GAME.length - 1];

describe('10 poles end of game', () => {
  it('passes the turn on every rope of a full game except the last', () => {
    let board: { from: number, to: number }[] = [];

    RECORDED_GAME.slice(0, -1).forEach((rope, i) => {
      const outcome = moves.stretchRope.apply(board, asPlayer(i % 2), rope);
      expect(outcome.nextBoard).toEqual([...board, rope]);
      expect(outcome.gameEnd).toBeUndefined();
      expect(outcome.isTurnEnd).toBe(true);
      board = outcome.nextBoard;
    });
  });

  it.each([0, 1])('ends for the mover (player %i) on the rope that saturates the grid', player => {
    const board = RECORDED_GAME.slice(0, -1);
    const outcome = moves.stretchRope.apply(board, asPlayer(player), lastRope);
    expect(outcome.nextBoard).toEqual([...board, lastRope]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});
