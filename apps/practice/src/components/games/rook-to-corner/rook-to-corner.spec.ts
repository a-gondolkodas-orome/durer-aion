import { moves } from './rook-to-corner';
import { isTarget, boardSize } from './helpers';
import { makeCtx } from '../../../test-utils';

// Unlike the other rook game, this one has an explicit goal square: reaching
// the bottom-right corner wins immediately, however much board is left.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const corner = { row: boardSize - 1, col: boardSize - 1 };
const at = (row: number, col: number) => ({ rookPosition: { row, col } });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) on reaching the corner', player => {
    expect(isTarget(corner)).toBe(true);
    const outcome = moves.moveRook.apply(at(0, corner.col), asPlayer(player), corner);
    expect(outcome.nextBoard.rookPosition).toEqual(corner);
    expect(outcome.gameEnd).toEqual({ winnerIndex: player });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn on any other square, however far along', () => {
    const nearlyThere = { row: corner.row, col: corner.col - 1 };
    expect(isTarget(nearlyThere)).toBe(false);
    const outcome = moves.moveRook.apply(at(corner.row, 0), asPlayer(0), nearlyThere);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
