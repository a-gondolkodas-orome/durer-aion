import { moves } from './matchstick-piles';
import { makeCtx } from '../../../test-utils';

// Taking the last match wins. Splitting a pile can never end the game, since a
// split always leaves more piles than it started with.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on taking the last match', player => {
    const outcome = moves.removeMatch.apply([1], asPlayer(player), 0);
    expect(outcome.nextBoard).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('drops an emptied pile without ending the game while others remain', () => {
    const outcome = moves.removeMatch.apply([1, 3], asPlayer(0), 0);
    expect(outcome.nextBoard).toEqual([3]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('never ends the game on a split — a split only ever adds a pile', () => {
    const outcome = moves.splitPile.apply([4], asPlayer(0), 0, 1);
    expect(outcome.nextBoard).toEqual([1, 3]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
