import { moves } from './increment-or-double';
import { makeCtx } from '../../../../test-utils';

// The player who passes 99 *loses*, so every ending credits the mover's
// opponent — the opposite of most games in the repo.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('increment-or-double end of game', () => {
  it.each([0, 1])('ends against the mover (player %i) when x+1 passes 99', player => {
    const outcome = moves.increment.apply(99, asPlayer(player));
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 - player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it.each([0, 1])('ends against the mover (player %i) when 2x passes 99', player => {
    const outcome = moves.double.apply(50, asPlayer(player));
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 - player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it.each([
    ['x+1', () => moves.increment.apply(5, asPlayer(0))],
    ['2x', () => moves.double.apply(4, asPlayer(0))]
  ])('passes the turn when %s stays short of the limit', (_name, play) => {
    const outcome = play();
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
