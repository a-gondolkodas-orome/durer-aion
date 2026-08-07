import { describe, it, expect } from 'vitest';
import { moves, type Board, type TurnState } from './gameplay';
import { makeCtx, moveValidator } from '../../../test-utils';

const isConversionAllowed = moveValidator(moves.convert);

describe('isConversionAllowed', () => {
  // Four 3s and six 1s: the values 1 and 3 are on the table, 2 and 4 are not.
  const board = [1, 1, 1, 1, 1, 1, 3, 3, 3, 3];

  it('accepts a value on the table turned into any smaller one', () => {
    expect(isConversionAllowed(board, 3, 1)).toBe(true);
    expect(isConversionAllowed(board, 3, 2)).toBe(true);
  });

  it('refuses a value that is not on the table', () => {
    expect(isConversionAllowed(board, 2, 1)).toBe(false);
    expect(isConversionAllowed(board, 4, 1)).toBe(false);
  });

  it('refuses a target that is not strictly smaller', () => {
    expect(isConversionAllowed(board, 3, 3)).toBe(false);
    expect(isConversionAllowed(board, 3, 4)).toBe(false);
  });

  it('refuses value-1 coins, which have no smaller value to become', () => {
    expect(isConversionAllowed(board, 1, 1)).toBe(false);
    expect(isConversionAllowed(board, 1, 0)).toBe(false);
  });

  it('refuses non-integer or non-positive arguments', () => {
    expect(isConversionAllowed(board, 3, 0)).toBe(false);
    expect(isConversionAllowed(board, 3, -1)).toBe(false);
    expect(isConversionAllowed(board, 3, 1.5)).toBe(false);
  });
});

// A conversion turns *every* coin of the chosen value into the same smaller
// one, and the player whose move leaves all ten coins equal wins.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx<TurnState>({ currentPlayer }) });

describe('end of game', () => {
  it('converts every coin of the chosen value at once', () => {
    const board: Board = [1, 1, 3, 3, 3, 4];
    expect(moves.convert.apply(board, asPlayer(0), 3, 2).nextBoard).toEqual([1, 1, 2, 2, 2, 4]);
  });

  it.each([0, 1])('ends for the mover (player %i) when every coin ends up equal', player => {
    const board: Board = [1, 1, 1, 3, 3];
    const outcome = moves.convert.apply(board, asPlayer(player), 3, 1);
    expect(outcome.nextBoard).toEqual([1, 1, 1, 1, 1]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while two values are still on the table', () => {
    const outcome = moves.convert.apply([1, 1, 3, 3, 4], asPlayer(0), 4, 2);
    expect(outcome.nextBoard).toEqual([1, 1, 2, 3, 3]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
