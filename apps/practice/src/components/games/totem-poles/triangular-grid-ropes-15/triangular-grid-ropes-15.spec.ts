import { moves } from './triangular-grid-ropes-15';
import { makeCtx } from '../../../../test-utils';

// A rope may not pass a pole another rope already touches, so the grid runs out
// of legal ropes on its own; the player who stretches the last one wins.
//
//         0
//        1 2
//       3 4 5
//      6 7 8 9
//    10 11 12 13 14
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

// Ropes may share an endpoint — only the poles a rope passes *by* must be free —
// so the grid does not run out until it is saturated. This recorded game is the
// shortest ending found, at twenty ropes.
const RECORDED_GAME = [
  [0, 14], [0, 10], [13, 9], [11, 6], [2, 1], [1, 13],
  [4, 3], [9, 8], [6, 8], [5, 4], [4, 2], [7, 4],
  [7, 3], [14, 13], [11, 13], [11, 10], [11, 7], [12, 7],
  [8, 5], [12, 8]
].map(([from, to]) => ({ from, to }));

const lastRope = RECORDED_GAME[RECORDED_GAME.length - 1];

describe('15 poles end of game', () => {
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
