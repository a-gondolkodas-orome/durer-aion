import { moves } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const isValidStep = moveValidator(moves.step);

describe('isValidStep', () => {
  it('accepts a step of one or two squares', () => {
    const board = { left: 1, right: 12 };
    expect(isValidStep(board, 1)).toBe(true);
    expect(isValidStep(board, 2)).toBe(true);
  });

  it('refuses any other step size', () => {
    const board = { left: 1, right: 12 };
    expect(isValidStep(board, 0)).toBe(false);
    expect(isValidStep(board, 3)).toBe(false);
    expect(isValidStep(board, -1)).toBe(false);
  });

  it('refuses the step that would land exactly on the other piece', () => {
    // One square apart: stepping one lands on the opponent, stepping two jumps
    // over them and wins.
    expect(isValidStep({ left: 5, right: 6 }, 1)).toBe(false);
    expect(isValidStep({ left: 5, right: 6 }, 2)).toBe(true);

    // Two squares apart: the roles are reversed.
    expect(isValidStep({ left: 5, right: 7 }, 2)).toBe(false);
    expect(isValidStep({ left: 5, right: 7 }, 1)).toBe(true);
  });

  it('leaves both steps open once the pieces are three or more apart', () => {
    expect(isValidStep({ left: 4, right: 7 }, 1)).toBe(true);
    expect(isValidStep({ left: 4, right: 7 }, 2)).toBe(true);
  });
});

// The two pieces walk towards each other — player 0 rightwards, player 1
// leftwards — and whoever jumps past the other wins. Which piece a step moves
// depends on the mover, so both directions are worth covering.
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
