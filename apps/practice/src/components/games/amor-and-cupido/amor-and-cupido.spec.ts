import { moves } from './amor-and-cupido';
import { TRIANGLES, generateStartBoard, completesTriangle } from './helpers';
import { makeCtx } from '../../../test-utils';

// A player wins the moment they own all three edges of one triangle, so the
// game can end long before the 15 edges run out.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on completing a triangle', player => {
    const [e0, e1, e2] = TRIANGLES[0];
    const board = generateStartBoard();
    board[e0] = player;
    board[e1] = player;
    expect(completesTriangle(board, player, e2)).toBe(true);

    const outcome = moves.claimEdge.apply(board, asPlayer(player), e2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('does not end on a triangle the opponent would complete', () => {
    const [e0, e1, e2] = TRIANGLES[0];
    const board = generateStartBoard();
    board[e0] = 1;
    board[e1] = 1;
    // player 0 taking the third edge blocks the triangle rather than making one
    const outcome = moves.claimEdge.apply(board, asPlayer(0), e2);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('passes the turn on an ordinary claim', () => {
    const outcome = moves.claimEdge.apply(generateStartBoard(), asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
