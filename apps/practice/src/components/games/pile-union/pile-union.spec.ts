import { moves } from './pile-union';
import { makeCtx } from '../../../test-utils';

// Taking the last match wins. Merging two piles can never end the game — it
// always leaves at least one pile behind.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on taking the last match', player => {
    const outcome = moves.removeOne.apply([1], asPlayer(player), 0);
    expect(outcome.nextBoard).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('drops an emptied pile without ending the game while others remain', () => {
    const outcome = moves.removeOne.apply([1, 2], asPlayer(0), 0);
    expect(outcome.nextBoard).toEqual([2]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('never ends the game on a merge — a merge always leaves a pile', () => {
    const outcome = moves.mergePiles.apply([1, 1], asPlayer(0), [0, 1]);
    expect(outcome.nextBoard).toEqual([2]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
