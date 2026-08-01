import {
  EDGES, TRIANGLES, edgeIndex, getAllowedMoves, completesTriangle, findWinningTriangle,
  generateStartBoard, isClaimAllowed
} from './helpers';

describe('helpers geometry', () => {
  it('has 15 edges and 20 triangles', () => {
    expect(EDGES).toHaveLength(15);
    expect(TRIANGLES).toHaveLength(20);
  });

  it('lists every empty edge as an allowed move', () => {
    const board = generateStartBoard();
    expect(getAllowedMoves(board)).toHaveLength(15);
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 1;
    // Edges owned by either player must be excluded, not just one colour.
    expect(getAllowedMoves(board)).toHaveLength(13);
    expect(getAllowedMoves(board)).not.toContain(edgeIndex[0][1]);
    expect(getAllowedMoves(board)).not.toContain(edgeIndex[0][2]);
  });
});

describe('completesTriangle', () => {
  it('detects when a move closes a same-colour triangle', () => {
    const board = generateStartBoard();
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 0;
    // Closing edge 1-2 finishes triangle {0,1,2} for player 0.
    expect(completesTriangle(board, 0, edgeIndex[1][2])).toBe(true);
  });

  it('does not fire when the partner edges belong to the other player', () => {
    const board = generateStartBoard();
    board[edgeIndex[0][1]] = 1;
    board[edgeIndex[0][2]] = 1;
    expect(completesTriangle(board, 0, edgeIndex[1][2])).toBe(false);
    // ...but it does complete a triangle for player 1.
    expect(completesTriangle(board, 1, edgeIndex[1][2])).toBe(true);
  });
});

describe('findWinningTriangle', () => {
  it('returns the three edges of a completed triangle', () => {
    const board = generateStartBoard();
    // Use a non-first triangle {3,4,5} and add a stray player-0 edge that lies in
    // earlier triangles, so a `some`-instead-of-`every` regression would return the
    // wrong (earlier) triangle rather than the actually completed one.
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[3][4]] = 0;
    board[edgeIndex[3][5]] = 0;
    board[edgeIndex[4][5]] = 0;
    expect(findWinningTriangle(board, 0)?.sort((a, b) => a - b)).toEqual(
      [edgeIndex[3][4], edgeIndex[3][5], edgeIndex[4][5]].sort((a, b) => a - b)
    );
    expect(findWinningTriangle(board, 1)).toBeNull();
  });
});

describe('isClaimAllowed', () => {
  it('accepts a pair nobody has claimed', () => {
    expect(isClaimAllowed(generateStartBoard(), 0)).toBe(true);
    expect(isClaimAllowed(generateStartBoard(), 14)).toBe(true);
  });

  it('refuses a pair either player already owns', () => {
    const board = generateStartBoard();
    board[3] = 0;
    board[7] = 1;
    expect(isClaimAllowed(board, 3)).toBe(false);
    expect(isClaimAllowed(board, 7)).toBe(false);
  });

  it('refuses a pair that does not exist', () => {
    expect(isClaimAllowed(generateStartBoard(), -1)).toBe(false);
    expect(isClaimAllowed(generateStartBoard(), 15)).toBe(false);
    expect(isClaimAllowed(generateStartBoard(), 1.5)).toBe(false);
  });

  it('accepts exactly the edges the generator lists', () => {
    const board = generateStartBoard();
    board[2] = 0;
    board[5] = 1;
    const listed = new Set(getAllowedMoves(board));
    for (let e = 0; e < EDGES.length; e++) {
      expect(isClaimAllowed(board, e)).toBe(listed.has(e));
    }
  });
});
