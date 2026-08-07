import {
  POLICE,
  THIEF,
  VERTEX_COUNT,
  dist,
  edges,
  generateStartBoard,
  moves,
  neighbours,
  pickCopCount,
  type Board
} from './gameplay';
import { range } from 'lodash';
import { makeCtx } from 'test-utils';

describe('modified Petersen graph', () => {
  it('has 15 vertices and 20 edges', () => {
    expect(VERTEX_COUNT).toBe(15);
    expect(edges).toHaveLength(20);
  });

  it('is a symmetric adjacency (undirected)', () => {
    for (let v = 0; v < VERTEX_COUNT; v++) {
      for (const u of neighbours[v]) {
        expect(neighbours[u]).toContain(v);
      }
    }
  });

  it('has degree 3 everywhere except the 5 subdivision nodes (degree 2)', () => {
    for (let v = 0; v < VERTEX_COUNT; v++) {
      const expected = v >= 5 && v < 10 ? 2 : 3;
      expect(neighbours[v]).toHaveLength(expected);
    }
  });

  it('has no self-loops or duplicate neighbours', () => {
    for (let v = 0; v < VERTEX_COUNT; v++) {
      expect(neighbours[v]).not.toContain(v);
      expect(new Set(neighbours[v]).size).toBe(neighbours[v].length);
    }
  });

  it('is connected with a symmetric distance matrix', () => {
    for (let a = 0; a < VERTEX_COUNT; a++) {
      for (let b = 0; b < VERTEX_COUNT; b++) {
        expect(dist[a][b]).toBe(dist[b][a]);
        expect(Number.isFinite(dist[a][b])).toBe(true);
      }
    }
  });
});

const meta = { ctx: makeCtx() };

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
    const outcome = moves.placeCop.apply(generateStartBoard(), meta, 7);
    expect(outcome.nextBoard.policemen).toEqual([7]);
    expect(outcome.nextBoard.phase).toBe('placingCops');
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends the turn and moves to thief placement once all police are placed', () => {
    // pin copCount so placing the second cop reliably completes placement
    // (generateStartBoard randomises it to 2 or 3)
    const board = { ...generateStartBoard(), copCount: 2, policemen: [7] };
    const outcome = moves.placeCop.apply(board, meta, 3);
    expect(outcome.nextBoard.policemen).toEqual([7, 3]);
    expect(outcome.nextBoard.phase).toBe('placingThief');
    expect(outcome.isTurnEnd).toBe(true);
  });
});

describe('moves.placeThief', () => {
  it('places the thief, enters the chasing phase and ends the turn', () => {
    const board: Board = { ...generateStartBoard(), policemen: [10, 11], phase: 'placingThief' };
    const outcome = moves.placeThief.apply(board, meta, 2);
    expect(outcome.nextBoard.thief).toBe(2);
    expect(outcome.nextBoard.phase).toBe('chasing');
    expect(outcome.nextBoard.copCursor).toBe(0);
    expect(outcome.isTurnEnd).toBe(true);
  });
});

describe('moves.moveCop', () => {
  it('advances the cursor and keeps the turn until every policeman has moved', () => {
    const outcome = moves.moveCop.apply(chasingBoard(), meta, 12);
    expect(outcome.nextBoard.policemen).toEqual([12, 11]);
    expect(outcome.nextBoard.copCursor).toBe(1);
    expect(outcome.isTurnEnd).toBeUndefined();
    expect(outcome.gameEnd).toBeUndefined();
  });

  it('ends the turn after the last policeman moves', () => {
    const outcome = moves.moveCop.apply(chasingBoard({ copCursor: 1 }), meta, 13);
    expect(outcome.nextBoard.policemen).toEqual([10, 13]);
    expect(outcome.nextBoard.copCursor).toBe(0);
    expect(outcome.isTurnEnd).toBe(true);
  });

  it('ends the game for the police when a policeman steps onto the thief', () => {
    // thief on vertex 0; blue cop at 10 is adjacent to 0
    const outcome = moves.moveCop.apply(chasingBoard({ thief: 0 }), meta, 0);
    expect(outcome.gameEnd).toEqual({ winnerIndex: POLICE });
    expect(outcome.isTurnEnd).toBeUndefined();
  });
});

describe('moves.moveThief', () => {
  it('records a move and ends the turn when the thief stays free', () => {
    const outcome = moves.moveThief.apply(chasingBoard({ thief: 0 }), meta, 5);
    expect(outcome.nextBoard.thief).toBe(5);
    expect(outcome.nextBoard.thiefMoveCount).toBe(1);
    expect(outcome.isTurnEnd).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
  });

  it('ends the game for the police when the thief steps onto a policeman', () => {
    const board = chasingBoard({ thief: 0, policemen: [5, 11] });
    const outcome = moves.moveThief.apply(board, meta, 5);
    expect(outcome.gameEnd).toEqual({ winnerIndex: POLICE });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends the game for the thief after a safe third move', () => {
    const board = chasingBoard({ thief: 0, thiefMoveCount: 2, policemen: [12, 13] });
    const outcome = moves.moveThief.apply(board, meta, 5);
    expect(outcome.gameEnd).toEqual({ winnerIndex: THIEF });
    expect(outcome.isTurnEnd).toBeUndefined();
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
