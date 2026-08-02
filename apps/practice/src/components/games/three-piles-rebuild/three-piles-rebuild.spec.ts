import { moves } from './three-piles-rebuild';
import { isTerminal } from './helpers';
import { makeCtx } from '../../../test-utils';

// A turn keeps one pile and rebuilds three from it; the opponent loses when
// none of the three can be split any further.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('leaves the turn open after keeping a pile', () => {
    const outcome = moves.keepPile.apply([5, 2, 3], asPlayer(0), 0);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it.each([0, 1])('ends for the mover (player %i) on rebuilding an unsplittable trio', player => {
    const outcome = moves.splitPile.apply([3, 0, 0], asPlayer(player), [1, 1, 1]);
    expect(isTerminal(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while some pile can still be split', () => {
    const outcome = moves.splitPile.apply([5, 0, 0], asPlayer(0), [1, 1, 3]);
    expect(isTerminal(outcome.nextBoard)).toBe(false);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
