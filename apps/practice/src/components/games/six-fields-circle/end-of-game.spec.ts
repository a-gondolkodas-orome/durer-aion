import { moves } from './six-fields-circle';
import { hasLegalMove } from './helpers';
import { makeCtx } from '../../../test-utils';

// A move needs two non-empty fields that are not opposite each other, so two
// survivors facing each other across the circle is a dead position.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when only opposite fields remain', p => {
    const outcome = moves.removeFromTwo.apply([1, 1, 0, 2, 0, 0], asPlayer(p), [1, 3]);
    expect(outcome.nextBoard).toEqual([1, 0, 0, 1, 0, 0]);
    expect(hasLegalMove(outcome.nextBoard)).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while a legal pair remains', () => {
    const outcome = moves.removeFromTwo.apply([2, 2, 1, 0, 0, 0], asPlayer(0), [0, 1]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
