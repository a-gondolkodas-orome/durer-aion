import { moves } from './gameplay';
import { makeCtx } from '../../../../test-utils';

// A turn is two moves: empty one pile, then split another into it. The game
// ends once every pile is down to a single piece, since a pile of one cannot
// be split.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

describe('pile-splitter-4 end of game', () => {
  it('leaves the turn open after emptying a pile', () => {
    const outcome = moves.removePile.apply([1, 1, 2, 5], asPlayer(0), 3);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it.each([0, 1])('ends for the mover (player %i) when every pile holds one', player => {
    const outcome = moves.splitPile.apply(
      [1, 1, 2, 0], asPlayer(player), { pileId: 2, pieceCount: 1 }
    );
    expect(outcome.nextBoard).toEqual([1, 1, 1, 1]);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while a pile can still be split', () => {
    const outcome = moves.splitPile.apply(
      [1, 1, 5, 0], asPlayer(0), { pileId: 2, pieceCount: 1 }
    );
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
