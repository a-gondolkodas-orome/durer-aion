import { moves, generateStartBoard, pickCopCount, type Board } from './policeman-thief-c';
import { range } from 'lodash';
import { makeEvents } from '../../../../test-utils';

const meta = () => ({ events: makeEvents() });

const chasingBoard = (overrides: Partial<Board> = {}): Board => ({
  copCount: 2,
  phase: 'chasing',
  policemen: [10, 11],
  thief: 0,
  thiefMoveCount: 0,
  copCursor: 0,
  ...overrides
});

describe('generateStartBoard', () => {
  it('starts in the police-placement phase with no pieces', () => {
    const board = generateStartBoard();
    expect(board.phase).toBe('placingCops');
    expect(board.policemen).toEqual([]);
    expect(board.thief).toBeNull();
    expect([2, 3]).toContain(board.copCount);
  });
});

describe('pickCopCount', () => {
  it('only ever deals 2 or 3 policemen', () => {
    const counts = new Set(range(500).map(() => pickCopCount()));
    expect([...counts].sort()).toEqual([2, 3]);
  });

  it('deals 2 policemen in the clear majority of games', () => {
    const samples = range(2000).map(() => pickCopCount());
    const threes = samples.filter((c) => c === 3).length;
    // ~20% expected; assert it stays a small minority with generous margins.
    expect(threes).toBeGreaterThan(samples.length * 0.05);
    expect(threes).toBeLessThan(samples.length * 0.40);
  });
});

describe('moves.placeCop', () => {
  it('adds a policeman without ending the turn until all are placed', () => {
    const { events } = meta();
    const { nextBoard } = moves.placeCop(generateStartBoard(), { events }, 7);
    expect(nextBoard.policemen).toEqual([7]);
    expect(nextBoard.phase).toBe('placingCops');
    expect(events.endTurn).not.toHaveBeenCalled();
  });

  it('ends the turn and moves to thief placement once all police are placed', () => {
    const { events } = meta();
    // pin copCount so placing the second cop reliably completes placement
    // (generateStartBoard randomises it to 2 or 3)
    const board = { ...generateStartBoard(), copCount: 2, policemen: [7] };
    const { nextBoard } = moves.placeCop(board, { events }, 3);
    expect(nextBoard.policemen).toEqual([7, 3]);
    expect(nextBoard.phase).toBe('placingThief');
    expect(events.endTurn).toHaveBeenCalledTimes(1);
  });
});

describe('moves.placeThief', () => {
  it('places the thief, enters the chasing phase and ends the turn', () => {
    const { events } = meta();
    const board: Board = { ...generateStartBoard(), policemen: [10, 11], phase: 'placingThief' };
    const { nextBoard } = moves.placeThief(board, { events }, 2);
    expect(nextBoard.thief).toBe(2);
    expect(nextBoard.phase).toBe('chasing');
    expect(nextBoard.copCursor).toBe(0);
    expect(events.endTurn).toHaveBeenCalledTimes(1);
  });
});

describe('moves.moveCop', () => {
  it('advances the cursor and keeps the turn until every policeman has moved', () => {
    const { events } = meta();
    const { nextBoard } = moves.moveCop(chasingBoard(), { events }, 12);
    expect(nextBoard.policemen).toEqual([12, 11]);
    expect(nextBoard.copCursor).toBe(1);
    expect(events.endTurn).not.toHaveBeenCalled();
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('ends the turn after the last policeman moves', () => {
    const { events } = meta();
    const { nextBoard } = moves.moveCop(chasingBoard({ copCursor: 1 }), { events }, 13);
    expect(nextBoard.policemen).toEqual([10, 13]);
    expect(nextBoard.copCursor).toBe(0);
    expect(events.endTurn).toHaveBeenCalledTimes(1);
  });

  it('ends the game for the police when a policeman steps onto the thief', () => {
    const { events } = meta();
    // thief on vertex 0; blue cop at 10 is adjacent to 0
    moves.moveCop(chasingBoard({ thief: 0 }), { events }, 0);
    expect(events.endGame).toHaveBeenCalledWith(0);
    expect(events.endTurn).not.toHaveBeenCalled();
  });
});

describe('moves.moveThief', () => {
  it('records a move and ends the turn when the thief stays free', () => {
    const { events } = meta();
    const { nextBoard } = moves.moveThief(chasingBoard({ thief: 0 }), { events }, 5);
    expect(nextBoard.thief).toBe(5);
    expect(nextBoard.thiefMoveCount).toBe(1);
    expect(events.endTurn).toHaveBeenCalledTimes(1);
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('ends the game for the police when the thief steps onto a policeman', () => {
    const { events } = meta();
    // thief at 9 (adjacent to 0 and 4); a cop sits on 9's neighbour... use direct overlap
    const board = chasingBoard({ thief: 0, policemen: [5, 11] });
    moves.moveThief(board, { events }, 5);
    expect(events.endGame).toHaveBeenCalledWith(0);
    expect(events.endTurn).not.toHaveBeenCalled();
  });

  it('ends the game for the thief after a safe third move', () => {
    const { events } = meta();
    const board = chasingBoard({ thief: 0, thiefMoveCount: 2, policemen: [12, 13] });
    moves.moveThief(board, { events }, 5);
    expect(events.endGame).toHaveBeenCalledWith(1);
    expect(events.endTurn).not.toHaveBeenCalled();
  });
});
