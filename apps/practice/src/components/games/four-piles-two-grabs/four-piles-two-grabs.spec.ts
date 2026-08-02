import { moves } from './four-piles-two-grabs';
import { isTerminal } from './helpers';
import { makeCtx } from '../../../test-utils';

// A move takes from exactly two piles, so a position with fewer than two
// non-empty piles is a loss for the player to move.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when the board empties', player => {
    const outcome = moves.takeStones.apply([1, 1, 0, 0], asPlayer(player), [1, 1, 0, 0]);
    expect(outcome.nextBoard).toEqual([0, 0, 0, 0]);
    expect(isTerminal(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('also ends when a single non-empty pile is left — one pile cannot be played', () => {
    const outcome = moves.takeStones.apply([2, 1, 0, 0], asPlayer(0), [1, 1, 0, 0]);
    expect(outcome.nextBoard).toEqual([1, 0, 0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while two piles stay non-empty', () => {
    const outcome = moves.takeStones.apply([2, 2, 0, 0], asPlayer(0), [1, 1, 0, 0]);
    expect(outcome.nextBoard).toEqual([1, 1, 0, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
