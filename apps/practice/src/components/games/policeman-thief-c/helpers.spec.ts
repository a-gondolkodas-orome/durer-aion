import { neighbours, VERTEX_COUNT, edges, dist } from './helpers';

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
