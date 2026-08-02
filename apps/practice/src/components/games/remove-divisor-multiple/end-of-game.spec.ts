import { range } from 'lodash';
import { moves, isAllowed } from './remove-divisor-multiple';
import { makeCtx } from '../../../test-utils';

// Each number removed must divide or be divisible by the previous one, so the
// game ends as soon as the previous move leaves no such number on the table.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (size: number, removed: number[], previousMove: number | null) => ({
  numbersOnTable: range(1, size + 1).map(n => !removed.includes(n)),
  previousMove
});

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when nothing may follow', p => {
    // only 4 and 5 are left and the previous move was 4; taking 5 leaves 4,
    // which neither divides nor is divisible by 5
    const before = board(5, [1, 2, 3], 4);
    const outcome = moves.removeNumber.apply(before, asPlayer(p), 5);
    expect(range(1, 6).some(n => isAllowed(outcome.nextBoard, n))).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while some number still divides or is divisible', () => {
    const outcome = moves.removeNumber.apply(board(6, [], null), asPlayer(0), 3);
    expect(outcome.nextBoard.previousMove).toBe(3);
    expect(isAllowed(outcome.nextBoard, 6)).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
