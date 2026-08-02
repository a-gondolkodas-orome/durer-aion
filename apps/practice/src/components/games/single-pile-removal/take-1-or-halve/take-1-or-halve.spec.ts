import { moves } from './take-1-or-halve';
import { makeCtx } from '../../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('take-1-or-halve end of game', () => {
  it.each([0, 1])('ends the game for the mover (player %i) when the pile is cleared', player => {
    const outcome = moves.take1.apply(1, asPlayer(player));
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while stones remain', () => {
    const outcome = moves.take1.apply(5, asPlayer(0));
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('never ends the game on a halving — an even pile always leaves at least one', () => {
    const outcome = moves.halve.apply(2);
    expect(outcome.nextBoard).toBe(1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
