import { moves, type Board } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isStepAllowed = moveValidator(moves.step);

const boardWith = (restricted: number | null): Board => ({ current: 10, target: 50, restricted });

describe('isStepAllowed', () => {
  it('allows any step from 1 to 12 when nothing is forbidden', () => {
    const board = boardWith(null);
    expect([1, 6, 12].every(step => isStepAllowed(board, step))).toBe(true);
  });

  it('rejects the step forbidden by superstition', () => {
    // the other player added 8, so 13 − 8 = 5 is forbidden
    expect(isStepAllowed(boardWith(5), 5)).toBe(false);
    expect(isStepAllowed(boardWith(5), 4)).toBe(true);
  });

  it('rejects standing still or stepping backwards', () => {
    const board = boardWith(null);
    expect(isStepAllowed(board, 0)).toBe(false);
    expect(isStepAllowed(board, -3)).toBe(false);
  });

  it('rejects a step of 13 or more', () => {
    const board = boardWith(null);
    expect(isStepAllowed(board, 13)).toBe(false);
    expect(isStepAllowed(board, 20)).toBe(false);
  });

  it('rejects a non-integer step', () => {
    expect(isStepAllowed(boardWith(null), 2.5)).toBe(false);
  });
});

// The player who reaches the target *loses*, so every ending credits the
// mover's opponent — the opposite of most games in the repo.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('superstitious-counting end of game', () => {
  it.each([0, 1])('ends against the mover (player %i) on reaching the target', player => {
    const outcome = moves.step.apply(
      { current: 95, target: 100, restricted: null }, asPlayer(player), 5
    );
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 - player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while short of the target', () => {
    const outcome = moves.step.apply(
      { current: 50, target: 100, restricted: null }, asPlayer(0), 5
    );
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
