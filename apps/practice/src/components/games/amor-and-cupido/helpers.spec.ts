import {
  EDGES, TRIANGLES, edgeIndex, getAllowedMoves, completesTriangle, findWinningTriangle,
  generateStartBoard
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
