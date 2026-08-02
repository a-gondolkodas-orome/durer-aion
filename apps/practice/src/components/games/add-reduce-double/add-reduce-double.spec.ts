import { moves } from './add-reduce-double';
import { makeCtx } from '../../../test-utils';

// A move takes an even number of pieces off one pile and puts half of them on
// the other, so the game ends once neither pile can give up two: [1,1], [0,1]
// and [1,0] are the dead positions.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const take = (board: number[], pileId: number, pieceCount: number, player = 0) =>
  moves.moveHalvedPieces.apply(board, asPlayer(player), { pileId, pieceCount });

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
