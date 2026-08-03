import { isNeighbour, isVertex, neighbours, VERTEX_COUNT } from './helpers';

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
