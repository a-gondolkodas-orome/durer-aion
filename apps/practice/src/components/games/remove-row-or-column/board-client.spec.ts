import { moves } from './board-client';
import { isEmpty, type Board } from './helpers';
import { makeCtx } from '../../../test-utils';

// Whoever takes the last disc off the board wins; the selected disc parked in
// ctx.turnState is cleared either way.
const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (grid: boolean[][]): Board => ({ grid });

describe('end of game', () => {
  it.each([0, 1])('ends for the mover (player %i) when the last discs come off', p => {
    const outcome = moves.removeLine.apply(
      board([[true, true]]), asPlayer(p), { r: 0, c: 0, orientation: 'row' }
    );
    expect(isEmpty(outcome.nextBoard.grid)).toBe(true);
    expect(outcome.gameEnd).toEqual({ winnerIndex: p });
    expect(outcome.isTurnEnd).toBeUndefined();
    expect(outcome.nextTurnState).toBeNull();
  });

  it('passes the turn while discs remain', () => {
    const outcome = moves.removeLine.apply(
      board([[true, true], [true, true]]), asPlayer(0), { r: 0, c: 0, orientation: 'row' }
    );
    expect(isEmpty(outcome.nextBoard.grid)).toBe(false);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.nextTurnState).toBeNull();
  });
});
