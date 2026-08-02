import { moves } from './triangular-grid-ropes-10';
import { makeCtx } from '../../../../test-utils';

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
