import { moves } from './number-covering';
import { makeCtx } from '../../../test-utils';

// The game runs until two numbers are left, and the *parity of their sum*
// decides it: even hands it to the first player, odd to the second. Nothing
// about whose turn it was matters, which is what these tests pin.
const meta = { ctx: makeCtx() };

describe('end of game', () => {
  it('gives an even remaining sum to the first player', () => {
    // covering 2 leaves 1 and 3
    const outcome = moves.coverNumber.apply([1, 2, 3], meta, 2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives an odd remaining sum to the second player', () => {
    // covering 1 leaves 2 and 3
    const outcome = moves.coverNumber.apply([1, 2, 3], meta, 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while more than two numbers show', () => {
    const outcome = moves.coverNumber.apply([1, 2, 3, 4], meta, 4);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
