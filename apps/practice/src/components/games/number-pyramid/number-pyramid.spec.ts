import { moves } from './number-pyramid';
import type { Board, Slot } from './strategy';
import { makeCtx } from '../../game-factory';
import { makeEvents } from '../../../test-utils';

const active = (value: number): Slot => ({ value, state: 'active' });

const makeBoard = (level0Values: number[], target: number): Board => ({
  levels: [
    level0Values.map(active),
    Array(4).fill(null),
    Array(2).fill(null),
    Array(1).fill(null)
  ],
  target,
  sortedInitial: [...level0Values].sort((a, b) => b - a)
});

describe('moves.combineTwo', () => {
  it('places combined value on next level', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const events = makeEvents();
    const { nextBoard } = moves.combineTwo(
      board, { ctx: makeCtx({ currentPlayer: 0 }), events }, { levelIdx: 0, indices: [0, 1] }
    );
    const level1Active = nextBoard.levels[1].find((s) => s?.state === 'active');
    expect(level1Active!.value).toBe(9);
  });

  it('marks both combined slots as consumed', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const events = makeEvents();
    const { nextBoard } = moves.combineTwo(
      board, { ctx: makeCtx({ currentPlayer: 0 }), events }, { levelIdx: 0, indices: [0, 1] }
    );
    expect(nextBoard.levels[0][0]!.state).toBe('consumed');
    expect(nextBoard.levels[0][1]!.state).toBe('consumed');
  });

  it('calls endTurn when combined value is below k', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const events = makeEvents();
    moves.combineTwo(board, { ctx: makeCtx({ currentPlayer: 0 }), events }, { levelIdx: 0, indices: [0, 1] });
    expect(events.endTurn).toHaveBeenCalledTimes(1);
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('calls endGame with current player when combined value reaches k', () => {
    // combined value 10+9=19 exactly equals k, so the "at least k" win must trigger
    const board = makeBoard([10, 9, 3, 2, 2, 2, 2, 2], 19);
    const events = makeEvents();
    moves.combineTwo(board, { ctx: makeCtx({ currentPlayer: 1 }), events }, { levelIdx: 0, indices: [0, 1] });
    expect(events.endGame).toHaveBeenCalledWith(1);
    expect(events.endTurn).not.toHaveBeenCalled();
  });

  it('does not mutate the original board', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const events = makeEvents();
    moves.combineTwo(board, { ctx: makeCtx({ currentPlayer: 0 }), events }, { levelIdx: 0, indices: [0, 1] });
    expect(board.levels[0][0]!.state).toBe('active');
  });
});
