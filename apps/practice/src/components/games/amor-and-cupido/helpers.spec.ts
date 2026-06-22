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
    expect(getAllowedMoves(board)).toHaveLength(14);
    expect(getAllowedMoves(board)).not.toContain(edgeIndex[0][1]);
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
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 0;
    board[edgeIndex[1][2]] = 0;
    expect(findWinningTriangle(board, 0)?.sort((a, b) => a - b)).toEqual(
      [edgeIndex[0][1], edgeIndex[0][2], edgeIndex[1][2]].sort((a, b) => a - b)
    );
    expect(findWinningTriangle(board, 1)).toBeNull();
  });
});
