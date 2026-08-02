import { moves } from './twelve-squares';
import { makeCtx } from '../../../test-utils';

// The two pieces walk towards each other — player 0 rightwards, player 1
// leftwards — and whoever jumps past the other wins. Which piece a step moves
// depends on the mover, so both directions are worth covering.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('end of game', () => {
  it('ends for the first player when their piece jumps past the second', () => {
    const outcome = moves.step.apply({ left: 5, right: 6 }, asPlayer(0), 2);
    expect(outcome.nextBoard).toEqual({ left: 7, right: 6 });
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends for the second player when their piece jumps past the first', () => {
    const outcome = moves.step.apply({ left: 5, right: 6 }, asPlayer(1), 2);
    expect(outcome.nextBoard).toEqual({ left: 5, right: 4 });
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while the pieces have not crossed', () => {
    const outcome = moves.step.apply({ left: 1, right: 12 }, asPlayer(0), 2);
    expect(outcome.nextBoard).toEqual({ left: 3, right: 12 });
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
