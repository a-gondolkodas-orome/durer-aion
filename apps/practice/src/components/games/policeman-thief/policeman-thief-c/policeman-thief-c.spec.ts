import { moves, generateStartBoard, pickCopCount, type Board } from './policeman-thief-c';
import { POLICE, THIEF, VERTEX_COUNT } from './helpers';
import { range } from 'lodash';
import { makeEvents, makeCtx } from '../../../../test-utils';

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
    const { nextBoard } = moves.placeCop.apply(generateStartBoard(), { events }, 7);
    expect(nextBoard.policemen).toEqual([7]);
    expect(nextBoard.phase).toBe('placingCops');
    expect(events.endTurn).not.toHaveBeenCalled();
  });

  it('ends the turn and moves to thief placement once all police are placed', () => {
    const { events } = meta();
    // pin copCount so placing the second cop reliably completes placement
    // (generateStartBoard randomises it to 2 or 3)
    const board = { ...generateStartBoard(), copCount: 2, policemen: [7] };
    const { nextBoard } = moves.placeCop.apply(board, { events }, 3);
    expect(nextBoard.policemen).toEqual([7, 3]);
    expect(nextBoard.phase).toBe('placingThief');
    expect(events.endTurn).toHaveBeenCalledTimes(1);
  });
});

describe('moves.placeThief', () => {
  it('places the thief, enters the chasing phase and ends the turn', () => {
    const { events } = meta();
    const board: Board = { ...generateStartBoard(), policemen: [10, 11], phase: 'placingThief' };
    const { nextBoard } = moves.placeThief.apply(board, { events }, 2);
    expect(nextBoard.thief).toBe(2);
    expect(nextBoard.phase).toBe('chasing');
    expect(nextBoard.copCursor).toBe(0);
    expect(events.endTurn).toHaveBeenCalledTimes(1);
  });
});

describe('moves.moveCop', () => {
  it('advances the cursor and keeps the turn until every policeman has moved', () => {
    const { events } = meta();
    const { nextBoard } = moves.moveCop.apply(chasingBoard(), { events }, 12);
    expect(nextBoard.policemen).toEqual([12, 11]);
    expect(nextBoard.copCursor).toBe(1);
    expect(events.endTurn).not.toHaveBeenCalled();
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('ends the turn after the last policeman moves', () => {
    const { events } = meta();
    const { nextBoard } = moves.moveCop.apply(chasingBoard({ copCursor: 1 }), { events }, 13);
    expect(nextBoard.policemen).toEqual([10, 13]);
    expect(nextBoard.copCursor).toBe(0);
    expect(events.endTurn).toHaveBeenCalledTimes(1);
  });

  it('ends the game for the police when a policeman steps onto the thief', () => {
    const { events } = meta();
    // thief on vertex 0; blue cop at 10 is adjacent to 0
    moves.moveCop.apply(chasingBoard({ thief: 0 }), { events }, 0);
    expect(events.endGame).toHaveBeenCalledWith(0);
    expect(events.endTurn).not.toHaveBeenCalled();
  });
});

describe('moves.moveThief', () => {
  it('records a move and ends the turn when the thief stays free', () => {
    const { events } = meta();
    const { nextBoard } = moves.moveThief.apply(chasingBoard({ thief: 0 }), { events }, 5);
    expect(nextBoard.thief).toBe(5);
    expect(nextBoard.thiefMoveCount).toBe(1);
    expect(events.endTurn).toHaveBeenCalledTimes(1);
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('ends the game for the police when the thief steps onto a policeman', () => {
    const { events } = meta();
    // thief at 9 (adjacent to 0 and 4); a cop sits on 9's neighbour... use direct overlap
    const board = chasingBoard({ thief: 0, policemen: [5, 11] });
    moves.moveThief.apply(board, { events }, 5);
    expect(events.endGame).toHaveBeenCalledWith(0);
    expect(events.endTurn).not.toHaveBeenCalled();
  });

  it('ends the game for the thief after a safe third move', () => {
    const { events } = meta();
    const board = chasingBoard({ thief: 0, thiefMoveCount: 2, policemen: [12, 13] });
    moves.moveThief.apply(board, { events }, 5);
    expect(events.endGame).toHaveBeenCalledWith(1);
    expect(events.endTurn).not.toHaveBeenCalled();
  });
});

describe('move legality', () => {
  const asPolice = { ctx: makeCtx({ currentPlayer: POLICE }) };
  const asThief = { ctx: makeCtx({ currentPlayer: THIEF }) };

  it('accepts a policeman on any vertex during the placement phase', () => {
    const board = generateStartBoard();
    expect(moves.placeCop.validate(board, asPolice, 0)).toBe(true);
    expect(moves.placeCop.validate(board, asPolice, VERTEX_COUNT - 1)).toBe(true);
    expect(moves.placeCop.validate(board, asPolice, VERTEX_COUNT)).toBe(false);
    expect(moves.placeCop.validate(board, asPolice, -1)).toBe(false);
  });

  it('refuses to place further policemen once the phase has moved on', () => {
    const board = { ...generateStartBoard(), phase: 'placingThief' as const, policemen: [0, 1] };
    expect(moves.placeCop.validate(board, asPolice, 5)).toBe(false);
  });

  it('keeps the thief off a vertex a policeman already occupies', () => {
    const board = { ...generateStartBoard(), phase: 'placingThief' as const, policemen: [0, 7] };
    expect(moves.placeThief.validate(board, asThief, 3)).toBe(true);
    expect(moves.placeThief.validate(board, asThief, 0)).toBe(false);
    expect(moves.placeThief.validate(board, asThief, 7)).toBe(false);
  });

  it('moves the policeman the cursor points at, along one edge', () => {
    const board = chasingBoard({ policemen: [10, 11], copCursor: 0 });
    expect(moves.moveCop.validate(board, asPolice, 0)).toBe(true); // 10 ~ 0
    expect(moves.moveCop.validate(board, asPolice, 1)).toBe(false); // 1 is 11's neighbour
    expect(moves.moveCop.validate(board, asPolice, 10)).toBe(false); // must move

    const second = chasingBoard({ policemen: [10, 11], copCursor: 1 });
    expect(moves.moveCop.validate(second, asPolice, 1)).toBe(true); // 11 ~ 1
    expect(moves.moveCop.validate(second, asPolice, 0)).toBe(false);
  });

  it('never lets one side make the other side\'s move', () => {
    const board = chasingBoard({ policemen: [10, 11], thief: 0 });
    expect(moves.moveCop.validate(board, asThief, 0)).toBe(false);
    expect(moves.moveThief.validate(board, asPolice, 5)).toBe(false);
  });

  it('refuses a chase move before the chase has started', () => {
    const board = generateStartBoard();
    expect(moves.moveCop.validate(board, asPolice, 0)).toBe(false);
    expect(moves.moveThief.validate(board, asThief, 0)).toBe(false);
  });
});
