import { cloneDeep } from 'lodash';
import {
  EDGES,
  TRIANGLES,
  completesTriangle,
  edgeIndex,
  findWinningTriangle,
  startBoard,
  getAllowedMoves,
  moves
} from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';


const isClaimAllowed = moveValidator(moves.claimEdge);

describe('helpers geometry', () => {
  it('has 15 edges and 20 triangles', () => {
    expect(EDGES).toHaveLength(15);
    expect(TRIANGLES).toHaveLength(20);
  });

  it('lists every empty edge as an allowed move', () => {
    const board = cloneDeep(startBoard);
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
    const board = cloneDeep(startBoard);
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 0;
    // Closing edge 1-2 finishes triangle {0,1,2} for player 0.
    expect(completesTriangle(board, 0, edgeIndex[1][2])).toBe(true);
  });

  it('does not fire when the partner edges belong to the other player', () => {
    const board = cloneDeep(startBoard);
    board[edgeIndex[0][1]] = 1;
    board[edgeIndex[0][2]] = 1;
    expect(completesTriangle(board, 0, edgeIndex[1][2])).toBe(false);
    // ...but it does complete a triangle for player 1.
    expect(completesTriangle(board, 1, edgeIndex[1][2])).toBe(true);
  });
});

describe('findWinningTriangle', () => {
  it('returns the three edges of a completed triangle', () => {
    const board = cloneDeep(startBoard);
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
    expect(isClaimAllowed(startBoard, 0)).toBe(true);
    expect(isClaimAllowed(cloneDeep(startBoard), 14)).toBe(true);
  });

  it('refuses a pair either player already owns', () => {
    const board = cloneDeep(startBoard);
    board[3] = 0;
    board[7] = 1;
    expect(isClaimAllowed(board, 3)).toBe(false);
    expect(isClaimAllowed(board, 7)).toBe(false);
  });

  it('refuses a pair that does not exist', () => {
    expect(isClaimAllowed(startBoard, -1)).toBe(false);
    expect(isClaimAllowed(cloneDeep(startBoard), 15)).toBe(false);
    expect(isClaimAllowed(startBoard, 1.5)).toBe(false);
  });

  it('accepts exactly the edges the generator lists', () => {
    const board = cloneDeep(startBoard);
    board[2] = 0;
    board[5] = 1;
    const listed = new Set(getAllowedMoves(board));
    for (let e = 0; e < EDGES.length; e++) {
      expect(isClaimAllowed(board, e)).toBe(listed.has(e));
    }
  });
});

// A player wins the moment they own all three edges of one triangle, so the
// game can end long before the 15 edges run out.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on completing a triangle', player => {
    const [e0, e1, e2] = TRIANGLES[0];
    const board = cloneDeep(startBoard);
    board[e0] = player;
    board[e1] = player;
    expect(completesTriangle(board, player, e2)).toBe(true);

    const outcome = moves.claimEdge.apply(board, asPlayer(player), e2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('does not end on a triangle the opponent would complete', () => {
    const [e0, e1, e2] = TRIANGLES[0];
    const board = cloneDeep(startBoard);
    board[e0] = 1;
    board[e1] = 1;
    // player 0 taking the third edge blocks the triangle rather than making one
    const outcome = moves.claimEdge.apply(board, asPlayer(0), e2);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('passes the turn on an ordinary claim', () => {
    const outcome = moves.claimEdge.apply(startBoard, asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
