import { isCoveringAllowed, moves, COVERED } from './gameplay';
import { makeCtx } from '../../../test-utils';

const meta = { ctx: makeCtx() };

describe('isCoveringAllowed', () => {
  const board = [1, 2, COVERED, 4, 5];

  it('allows covering a number still showing', () => {
    expect([1, 2, 4, 5].every(number => isCoveringAllowed(board, number))).toBe(true);
  });

  it('rejects a number already covered', () => {
    expect(isCoveringAllowed(board, 3)).toBe(false);
  });

  it('rejects a number not on the table', () => {
    expect(isCoveringAllowed(board, 6)).toBe(false);
    expect(isCoveringAllowed(board, 0)).toBe(false);
    expect(isCoveringAllowed(board, 2.5)).toBe(false);
  });
});

// The game runs until two numbers are left, and the *parity of their sum*
// decides it: even hands it to the first player, odd to the second. Nothing
// about whose turn it was matters, which is what these tests pin.
describe('end of game', () => {
  it('gives an even remaining sum to the first player', () => {
    // covering 2 leaves 1 and 3
    const outcome = moves.coverNumber.apply([1, 2, 3], meta, 2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives an odd remaining sum to the second player', () => {
    // covering 1 leaves 2 and 3
    const outcome = moves.coverNumber.apply([1, 2, 3], meta, 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while more than two numbers show', () => {
    const outcome = moves.coverNumber.apply([1, 2, 3, 4], meta, 4);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
