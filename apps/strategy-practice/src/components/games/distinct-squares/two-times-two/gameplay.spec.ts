import { moves } from './gameplay';
import { makeCtx } from 'test-utils';

// The game always ends on the sixth square; the second player wins only if the
// four counts are all distinct by then.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('two-times-two end of game', () => {
  it('gives the game to the second player when the four counts are all distinct', () => {
    // 0+1+2+2 -> placing on the last pile makes 0,1,2,3
    const outcome = moves.addPiece.apply([0, 1, 2, 2], asPlayer(0), 3);
    expect(outcome.nextBoard).toEqual([0, 1, 2, 3]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the first player when two counts coincide', () => {
    // 1+1+1+2 -> the sixth square makes 2,1,1,2, which is not 0,1,2,3
    const outcome = moves.addPiece.apply([1, 1, 1, 2], asPlayer(0), 0);
    expect(outcome.nextBoard).toEqual([2, 1, 1, 2]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn before the sixth square is placed', () => {
    const outcome = moves.addPiece.apply([0, 1, 1, 2], asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
