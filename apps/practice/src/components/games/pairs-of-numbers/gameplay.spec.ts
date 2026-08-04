import { moves } from './gameplay';
import { makeCtx } from '../../../test-utils';

// Whoever first writes a pair that is not all-positive wins, which happens
// exactly when `subtract` drives a - b to zero or below.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('moves.subtract end of game', () => {
  it.each([0, 1])('ends the game for the mover (player %i) when a - b reaches 0', player => {
    const outcome = moves.subtract.apply([4, 4], asPlayer(player));
    expect(outcome.nextBoard).toEqual([0, 4]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends the game when a - b goes negative', () => {
    const outcome = moves.subtract.apply([2, 5], asPlayer(0));
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('only passes the turn while a - b stays positive', () => {
    const outcome = moves.subtract.apply([9, 4], asPlayer(0));
    expect(outcome.nextBoard).toEqual([5, 4]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});

describe('moves.add1', () => {
  it('never ends the game — raising b keeps both numbers positive', () => {
    const outcome = moves.add1.apply([1, 1]);
    expect(outcome.nextBoard).toEqual([1, 2]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
