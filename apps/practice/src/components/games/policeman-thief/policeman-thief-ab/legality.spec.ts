import { isNeighbour, isVertex, neighbours, POLICE, THIEF, VERTEX_COUNT } from './helpers';
import { moves, type Board } from './policeman-thief-ab';
import { makeCtx } from '../../../../test-utils';

const board = (overrides: Partial<Board> = {}): Board => ({
  turnCount: 0,
  policemen: [0, 3],
  thief: 6,
  firstPolicemanMoved: false,
  ...overrides
});

const asPolice = { ctx: makeCtx({ currentPlayer: POLICE }) };
const asThief = { ctx: makeCtx({ currentPlayer: THIEF }) };

describe('graph predicates', () => {
  it('accepts only the eight intersections', () => {
    expect(isVertex(0)).toBe(true);
    expect(isVertex(VERTEX_COUNT - 1)).toBe(true);
    expect(isVertex(VERTEX_COUNT)).toBe(false);
    expect(isVertex(-1)).toBe(false);
    expect(isVertex(1.5)).toBe(false);
  });

  it('accepts exactly the pairs joined by a road', () => {
    for (let v = 0; v < VERTEX_COUNT; v++) {
      for (let u = 0; u < VERTEX_COUNT; u++) {
        expect(isNeighbour(v, u)).toBe(neighbours[v].includes(u));
      }
    }
  });

  it('never treats an intersection as its own neighbour — staying put is not a move', () => {
    for (let v = 0; v < VERTEX_COUNT; v++) expect(isNeighbour(v, v)).toBe(false);
  });
});

describe('move legality', () => {
  it('lets the thief step to an adjacent intersection only', () => {
    expect(moves.moveThief.validate(board(), asThief, 2)).toBe(true); // 6 ~ 2
    expect(moves.moveThief.validate(board(), asThief, 1)).toBe(false);
    expect(moves.moveThief.validate(board(), asThief, 6)).toBe(false); // must move
  });

  it('does not let the police move the thief, nor the thief the police', () => {
    expect(moves.moveThief.validate(board(), asPolice, 2)).toBe(false);
    expect(moves.moveFirstPoliceman.validate(board(), asThief, 1)).toBe(false);
  });

  it('offers the blue policeman first and the green one only afterwards', () => {
    const beforeSplit = board();
    expect(moves.moveFirstPoliceman.validate(beforeSplit, asPolice, 1)).toBe(true); // 0 ~ 1
    expect(moves.moveSecondPoliceman.validate(beforeSplit, asPolice, 1)).toBe(false);

    const afterFirst = board({ firstPolicemanMoved: true });
    expect(moves.moveFirstPoliceman.validate(afterFirst, asPolice, 1)).toBe(false);
    expect(moves.moveSecondPoliceman.validate(afterFirst, asPolice, 1)).toBe(true); // 3 ~ 1
  });

  it('keeps each policeman to its own neighbours', () => {
    // Vertex 4 is adjacent to the blue policeman on 0, but not to the green on 3.
    expect(moves.moveFirstPoliceman.validate(board(), asPolice, 4)).toBe(true);
    expect(moves.moveSecondPoliceman.validate(
      board({ firstPolicemanMoved: true }), asPolice, 4
    )).toBe(false);
  });
});
