import { moves } from './digit-subtraction';
import { makeCtx } from '../../../test-utils';

// Players subtract one of the number's own non-zero digits; whoever reaches
// zero wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on reaching zero', player => {
    const outcome = moves.subtractDigit.apply(7, asPlayer(player), 7);
    expect(outcome.nextBoard).toBe(0);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while the number stays positive', () => {
    const outcome = moves.subtractDigit.apply(27, asPlayer(0), 7);
    expect(outcome.nextBoard).toBe(20);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
