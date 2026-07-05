import { vertices, isAllowed, isGameEnd, getAllowedMoves, getAllowedSuperset, edgeDirection } from './helpers';

describe('15 totem poles geometry', () => {
  it('has 15 poles arranged in 5 rows', () => {
    expect(vertices).toHaveLength(15);
    // every pole satisfies x + y + z = 2N with N = 4
    vertices.forEach(v => expect(v.x + v.y + v.z).toBe(8));
  });

  it('offers the 12 maximal lines as opening moves', () => {
    // 4 lines per direction (rows/lines of length 2..5), 3 directions
    expect(getAllowedMoves([])).toHaveLength(12);
  });

  it('recognises ropes parallel to a triangle side and rejects others', () => {
    expect(edgeDirection({ from: 3, to: 5 })).toBe('x'); // a row
    expect(edgeDirection({ from: 0, to: 10 })).toBe('z'); // the left side
    expect(edgeDirection({ from: 0, to: 12 })).toBeNull(); // not parallel to any side
  });

  it('auto-extends a rope to its maximal collinear segment', () => {
    // 6-7 lies on the bottom row 10..14? no: 6-9 is a row; 6-7 extends to 6-9
    expect(getAllowedSuperset([], { from: 6, to: 7 })).toEqual({ from: 6, to: 9 });
  });

  it('forbids drawing a rope past an already-touched pole', () => {
    const board = [{ from: 10, to: 14 }]; // bottom side, touches poles 10..14
    // 6-9 would pass pole 7/8 (untouched) — allowed; but 11-13 passes pole 12 which
    // is touched by the bottom rope
    expect(isAllowed(board, { from: 11, to: 13 })).toBe(false);
  });

  it('detects the end of the game', () => {
    expect(isGameEnd([])).toBe(false);
  });
});
