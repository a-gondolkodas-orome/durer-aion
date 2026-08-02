import { moves } from './take-power-of-two';
import { makeCtx } from '../../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('take-power-of-two end of game', () => {
  it.each([0, 1])('ends the game for the mover (player %i) when the pile is cleared', player => {
    const outcome = moves.subtractPowerOfTwo.apply(8, asPlayer(player), 3);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while stones remain', () => {
    const outcome = moves.subtractPowerOfTwo.apply(20, asPlayer(0), 2);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
