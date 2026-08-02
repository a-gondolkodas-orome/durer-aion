import { moves } from './bank-robbers';
import { makeCtx } from '../../../test-utils';

// A bank can be robbed only while at least one of its two neighbours still
// stands, so the game ends as soon as every survivor is isolated.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (circle: boolean[]) => ({ circle, lastMove: 0, firstMove: 0 });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when every standing bank is isolated', p => {
    // robbing bank 0 leaves only bank 1, whose neighbours (3 and 2) are both gone
    const outcome = moves.rob.apply(board([true, true, false, false]), asPlayer(p), 0);
    expect(outcome.nextBoard.circle).toEqual([false, true, false, false]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while some bank still has a standing neighbour', () => {
    const outcome = moves.rob.apply(board([true, true, true, false]), asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
