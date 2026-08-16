import { moves } from './gameplay';
import { makeCtx } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('doubling-reduction end of game', () => {
  it.each([0, 1])('ends the game for the mover (player %i) when the pile is cleared', player => {
    const outcome = moves.take.apply({ stones: 3, maxTake: 3 }, asPlayer(player), 3);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while stones remain', () => {
    const outcome = moves.take.apply({ stones: 9, maxTake: 9 }, asPlayer(0), 3);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
