import { POLICE, THIEF, VERTEX_COUNT, isNeighbour, isVertex, moves, neighbours, type Board } from './gameplay';
import { makeCtx } from '../../../../test-utils';

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

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const board = (overrides: Partial<Board> = {}): Board => ({
  turnCount: 0,
  policemen: [0, 0],
  thief: 3,
  firstPolicemanMoved: false,
  ...overrides
});

describe('move legality', () => {
  // Blue policeman on 0, green on 3, thief on 6.
  const chase = (overrides: Partial<Board> = {}) =>
    board({ policemen: [0, 3], thief: 6, ...overrides });

  it('lets the thief step to an adjacent intersection only', () => {
    expect(moves.moveThief.validate(chase(), asPlayer(THIEF), 2)).toBe(true); // 6 ~ 2
    expect(moves.moveThief.validate(chase(), asPlayer(THIEF), 1)).toBe(false);
    expect(moves.moveThief.validate(chase(), asPlayer(THIEF), 6)).toBe(false); // must move
  });

  it('does not let the police move the thief, nor the thief the police', () => {
    expect(moves.moveThief.validate(chase(), asPlayer(POLICE), 2)).toBe(false);
    expect(moves.moveFirstPoliceman.validate(chase(), asPlayer(THIEF), 1)).toBe(false);
  });

  it('offers the blue policeman first and the green one only afterwards', () => {
    const beforeSplit = chase();
    expect(moves.moveFirstPoliceman.validate(beforeSplit, asPlayer(POLICE), 1)).toBe(true); // 0 ~ 1
    expect(moves.moveSecondPoliceman.validate(beforeSplit, asPlayer(POLICE), 1)).toBe(false);

    const afterFirst = chase({ firstPolicemanMoved: true });
    expect(moves.moveFirstPoliceman.validate(afterFirst, asPlayer(POLICE), 1)).toBe(false);
    expect(moves.moveSecondPoliceman.validate(afterFirst, asPlayer(POLICE), 1)).toBe(true); // 3 ~ 1
  });

  it('keeps each policeman to its own neighbours', () => {
    // Vertex 4 is adjacent to the blue policeman on 0, but not to the green on 3.
    expect(moves.moveFirstPoliceman.validate(chase(), asPlayer(POLICE), 4)).toBe(true);
    expect(moves.moveSecondPoliceman.validate(
      chase({ firstPolicemanMoved: true }), asPlayer(POLICE), 4
    )).toBe(false);
  });
});

// The police win by landing on the thief within three thief moves; surviving
// the third move wins it for the thief.
describe('end of game', () => {
  it('gives the game to the police when the thief walks into one', () => {
    // vertices 3 and 1 are neighbours on the cube graph; a policeman waits on 1
    const outcome = moves.moveThief.apply(board({ policemen: [1, 5] }), asPlayer(THIEF), 1);
    expect(outcome.gameEnd).toEqual({ winnerIndex: POLICE });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('gives the game to the thief once the third move leaves them free', () => {
    const outcome = moves.moveThief.apply(
      board({ turnCount: 2, policemen: [0, 5], thief: 3 }), asPlayer(THIEF), 1
    );
    expect(outcome.nextBoard.turnCount).toBe(3);
    expect(outcome.gameEnd).toEqual({ winnerIndex: THIEF });
  });

  it('gives the game to the police when the second policeman catches the thief', () => {
    const outcome = moves.moveSecondPoliceman.apply(
      board({ policemen: [0, 1], firstPolicemanMoved: true, thief: 3 }), asPlayer(POLICE), 3
    );
    expect(outcome.gameEnd).toEqual({ winnerIndex: POLICE });
  });

  it('leaves the police turn open after only the first policeman has moved', () => {
    const outcome = moves.moveFirstPoliceman.apply(board(), asPlayer(POLICE), 1);
    expect(outcome.nextBoard.firstPolicemanMoved).toBe(true);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('passes the turn while the chase is still on', () => {
    const outcome = moves.moveThief.apply(board({ policemen: [0, 5] }), asPlayer(THIEF), 1);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
