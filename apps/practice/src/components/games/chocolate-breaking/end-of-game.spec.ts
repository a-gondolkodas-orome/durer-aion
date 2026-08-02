import { moves } from './chocolate-breaking';
import { hasSafeBreak, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// The player forced to break off the first 1×1 loses, so the game ends on the
// move that leaves the table with no safe break at all.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const single = (w: number, h: number): Board => ({ pieces: [{ id: 0, w, h }], nextId: 1 });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when no safe break is left', p => {
    // 1×4 splits into two 1×2 strips, neither of which can be broken safely
    const outcome = moves.breakPiece.apply(single(1, 4), asPlayer(p), { id: 0, dir: 'h', pos: 2 });
    expect(outcome.nextBoard.pieces.map(({ w, h }) => [w, h])).toEqual([[1, 2], [1, 2]]);
    expect(hasSafeBreak(outcome.nextBoard.pieces)).toBe(false);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while some piece can still be broken safely', () => {
    // 2×4 into 2×1 and 2×3: the 2×3 is still flexible
    const outcome = moves.breakPiece.apply(single(2, 4), asPlayer(0), { id: 0, dir: 'h', pos: 1 });
    expect(hasSafeBreak(outcome.nextBoard.pieces)).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
