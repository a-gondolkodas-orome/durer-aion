import { moves } from './gameplay';
import { isCombineAllowed, applyMoveToBoard, type Board, type Slot } from './strategy';
import { makeCtx } from '../../../test-utils';

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
  const combine = (board: Board, currentPlayer: number) => moves.combineTwo.apply(
    board, { ctx: makeCtx({ currentPlayer }) }, { levelIdx: 0, indices: [0, 1] }
  );

  it('places combined value on next level', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const { nextBoard } = combine(board, 0);
    const level1Active = nextBoard.levels[1].find((s) => s?.state === 'active');
    expect(level1Active!.value).toBe(9);
  });

  it('marks both combined slots as consumed', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const { nextBoard } = combine(board, 0);
    expect(nextBoard.levels[0][0]!.state).toBe('consumed');
    expect(nextBoard.levels[0][1]!.state).toBe('consumed');
  });

  it('ends the turn when combined value is below k', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    const outcome = combine(board, 0);
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
  });

  it('ends the game for the current player when combined value reaches k', () => {
    // combined value 10+9=19 exactly equals k, so the "at least k" win must trigger
    const board = makeBoard([10, 9, 3, 2, 2, 2, 2, 2], 19);
    const outcome = combine(board, 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('always clears the turn state', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    expect(combine(board, 0).nextTurnState).toBeNull();
    expect(combine(makeBoard([10, 9, 3, 2, 2, 2, 2, 2], 19), 1).nextTurnState).toBeNull();
  });

  it('does not mutate the original board', () => {
    const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);
    combine(board, 0);
    expect(board.levels[0][0]!.state).toBe('active');
  });
});

describe('isCombineAllowed', () => {
  const board = makeBoard([5, 4, 3, 2, 2, 2, 2, 2], 50);

  it('accepts two distinct active slots on a level that has one above it', () => {
    expect(isCombineAllowed(board, { levelIdx: 0, indices: [0, 1] })).toBe(true);
    expect(isCombineAllowed(board, { levelIdx: 0, indices: [7, 3] })).toBe(true);
  });

  it('refuses the same slot twice, or anything that is not a pair', () => {
    expect(isCombineAllowed(board, { levelIdx: 0, indices: [2, 2] })).toBe(false);
    expect(isCombineAllowed(board, { levelIdx: 0, indices: [0] })).toBe(false);
    expect(isCombineAllowed(board, { levelIdx: 0, indices: [0, 1, 2] })).toBe(false);
  });

  it('refuses a slot that is empty or already consumed', () => {
    // Level 1 is still empty; combining two of its slots is not a move.
    expect(isCombineAllowed(board, { levelIdx: 1, indices: [0, 1] })).toBe(false);
    const { nextBoard } = applyMoveToBoard(board, 0, [0, 1]);
    expect(isCombineAllowed(nextBoard, { levelIdx: 0, indices: [0, 2] })).toBe(false);
    expect(isCombineAllowed(nextBoard, { levelIdx: 0, indices: [2, 3] })).toBe(true);
  });

  it('refuses the top level — there is nowhere to write the sum', () => {
    expect(isCombineAllowed(board, { levelIdx: 3, indices: [0, 1] })).toBe(false);
    expect(isCombineAllowed(board, { levelIdx: 4, indices: [0, 1] })).toBe(false);
    expect(isCombineAllowed(board, { levelIdx: -1, indices: [0, 1] })).toBe(false);
  });

  it('refuses a slot index off the level', () => {
    expect(isCombineAllowed(board, { levelIdx: 0, indices: [0, 8] })).toBe(false);
  });
});
