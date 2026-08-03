import { isSpreadAllowed, moves, type Board } from './four-piles-spread-ahead';
import { makeCtx } from '../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const spread = (board: number[], pileId: number, pieceCount: number, player = 0) =>
  moves.spreadPieces.apply(board, asPlayer(player), { pileId, pieceCount });

describe('isSpreadAllowed', () => {
  const board: Board = [2, 3, 4, 5];

  it('allows spreading onto every pile in front of the chosen one', () => {
    expect([1, 2, 3].every(pieceCount => isSpreadAllowed(board, 3, pieceCount))).toBe(true);
  });

  it('rejects spreading further forward than the first pile', () => {
    expect(isSpreadAllowed(board, 3, 4)).toBe(false);
    expect(isSpreadAllowed(board, 1, 2)).toBe(false);
  });

  it('rejects any move from the first pile, which has nothing in front of it', () => {
    expect(isSpreadAllowed(board, 0, 1)).toBe(false);
  });

  it('rejects taking more pieces than the pile holds', () => {
    expect(isSpreadAllowed([2, 3, 1, 5], 2, 2)).toBe(false);
    expect(isSpreadAllowed([2, 3, 1, 5], 2, 1)).toBe(true);
  });

  it('rejects taking nothing', () => {
    expect(isSpreadAllowed(board, 3, 0)).toBe(false);
  });

  it('rejects a pile id outside the board or a non-integer count', () => {
    expect(isSpreadAllowed(board, 4, 1)).toBe(false);
    expect(isSpreadAllowed(board, 3, 1.5)).toBe(false);
  });
});

// A spread takes pieces off pile n and adds one to each of the n piles before
// it. Only pile 0 is ever a dead end, so the game ends once piles 1, 2 and 3
// are all empty — whatever is left in pile 0 is unreachable.
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when piles 1-3 all empty', player => {
    const outcome = spread([0, 1, 0, 0], 1, 1, player);
    expect(outcome.nextBoard).toEqual([1, 0, 0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ignores whatever piles up in pile 0 — it can never be spread from', () => {
    const outcome = spread([7, 1, 0, 0], 1, 1, 0);
    expect(outcome.nextBoard).toEqual([8, 0, 0, 0]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while any of piles 1-3 holds a piece', () => {
    const outcome = spread([0, 0, 2, 0], 2, 2, 0);
    expect(outcome.nextBoard).toEqual([1, 1, 0, 0]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
