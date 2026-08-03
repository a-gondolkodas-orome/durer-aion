import { isTransferAllowed, moves } from './add-reduce-double';
import { makeCtx } from '../../../test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const take = (board: number[], pileId: number, pieceCount: number, player = 0) =>
  moves.moveHalvedPieces.apply(board, asPlayer(player), { pileId, pieceCount });

describe('isTransferAllowed', () => {
  const board = [6, 3];

  it('accepts an even count from two up to the whole pile', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 2 })).toBe(true);
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 4 })).toBe(true);
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 6 })).toBe(true);
    expect(isTransferAllowed(board, { pileId: 1, pieceCount: 2 })).toBe(true);
  });

  it('refuses an odd count — half of it could not be moved across', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 3 })).toBe(false);
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 5 })).toBe(false);
  });

  it('refuses taking nothing', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 0 })).toBe(false);
  });

  it('refuses taking more than the pile holds', () => {
    expect(isTransferAllowed(board, { pileId: 0, pieceCount: 8 })).toBe(false);
    expect(isTransferAllowed(board, { pileId: 1, pieceCount: 4 })).toBe(false);
  });

  it('refuses a pile that does not exist', () => {
    expect(isTransferAllowed(board, { pileId: 2, pieceCount: 2 })).toBe(false);
    expect(isTransferAllowed(board, { pileId: -1, pieceCount: 2 })).toBe(false);
  });
});

// A move takes an even number of pieces off one pile and puts half of them on
// the other, so the game ends once neither pile can give up two: [1,1], [0,1]
// and [1,0] are the dead positions.
describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when both piles hold one', player => {
    const outcome = take([3, 0], 0, 2, player);
    expect(outcome.nextBoard).toEqual([1, 1]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends when a pile empties and the other is left with one', () => {
    const outcome = take([2, 0], 0, 2);
    expect(outcome.nextBoard).toEqual([0, 1]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('passes the turn while a pile still holds two', () => {
    const outcome = take([5, 0], 0, 2);
    expect(outcome.nextBoard).toEqual([3, 1]);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
