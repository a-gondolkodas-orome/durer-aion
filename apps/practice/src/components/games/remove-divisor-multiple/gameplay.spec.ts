import { range } from 'lodash';
import { moves } from './gameplay';
import { makeCtx, moveValidator } from 'test-utils';

const isAllowed = moveValidator(moves.removeNumber);

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (previousMove: number | null, removed: number[] = [], size = 10) => ({
  numbersOnTable: range(1, size + 1).map(n => !removed.includes(n)),
  previousMove
});

describe('isAllowed', () => {
  it('accepts any number on the table as the opening move', () => {
    expect(isAllowed(board(null), 1)).toBe(true);
    expect(isAllowed(board(null), 10)).toBe(true);
  });

  it('accepts divisors and multiples of the number just removed', () => {
    const after6 = board(6, [6]);
    expect(isAllowed(after6, 2)).toBe(true); // divisor
    expect(isAllowed(after6, 3)).toBe(true); // divisor
    expect(isAllowed(after6, 1)).toBe(true); // divisor
    expect(isAllowed(after6, 4)).toBe(false); // neither
    expect(isAllowed(after6, 5)).toBe(false); // neither
  });

  it('refuses a number that has already been removed', () => {
    expect(isAllowed(board(6, [6, 3]), 3)).toBe(false);
    expect(isAllowed(board(null, [4]), 4)).toBe(false);
  });

  it('refuses a number that is not on the board at all', () => {
    expect(isAllowed(board(null), 0)).toBe(false);
    expect(isAllowed(board(null), 11)).toBe(false);
    expect(isAllowed(board(null), 2.5)).toBe(false);
    expect(isAllowed(board(6, [6]), 12)).toBe(false);
  });
});

// Each number removed must divide or be divisible by the previous one, so the
// game ends as soon as the previous move leaves no such number on the table.
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when nothing may follow', p => {
    // only 4 and 5 are left and the previous move was 4; taking 5 leaves 4,
    // which neither divides nor is divisible by 5
    const before = board(4, [1, 2, 3], 5);
    const outcome = moves.removeNumber.apply(before, asPlayer(p), 5);
    expect(range(1, 6).some(n => isAllowed(outcome.nextBoard, n))).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while some number still divides or is divisible', () => {
    const outcome = moves.removeNumber.apply(board(null, [], 6), asPlayer(0), 3);
    expect(outcome.nextBoard.previousMove).toBe(3);
    expect(isAllowed(outcome.nextBoard, 6)).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
