import { moves } from './latin-square-filling';
import { isFull, legalMoves, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// Two different endings: filling the ninth cell wins for the first player,
// while leaving the next player stuck in front of an empty cell wins for the
// second. The move reads no ctx, so the winner is fixed by the position.
const meta = { ctx: makeCtx() };

describe('end of game', () => {
  it('gives the game to the first player when the grid gets filled', () => {
    //  1 2 3 / 2 3 1 / 3 1 _  — writing 2 into the last cell completes the square
    const board: Board = [1, 2, 3, 2, 3, 1, 3, 1, 0];
    const outcome = moves.placeDigit.apply(board, meta, 8, 2);
    expect(isFull(outcome.nextBoard)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the second player when the next player is stuck', () => {
    // writing 1 into the top-left cell reaches
    //   1 2 _ / 2 1 _ / _ _ 3
    // where all four empty cells see all three digits along their row and
    // column, so the next player cannot move although the grid is not full
    const board: Board = [0, 2, 0, 2, 1, 0, 0, 0, 3];
    const outcome = moves.placeDigit.apply(board, meta, 0, 1);
    expect(isFull(outcome.nextBoard)).toBe(false);
    expect(legalMoves(outcome.nextBoard)).toEqual([]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn while legal moves remain and cells are empty', () => {
    const outcome = moves.placeDigit.apply(Array(9).fill(0) as Board, meta, 0, 1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
