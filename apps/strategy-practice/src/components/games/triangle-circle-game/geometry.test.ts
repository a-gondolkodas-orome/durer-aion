import {
  VERTICES, TRIANGLES, EDGES,
  TRIANGLE_COUNT, EDGE_COUNT, edgeOrbit
} from './geometry';

describe('side-6 triangular grid geometry', () => {
  it('has the expected element counts', () => {
    expect(VERTICES).toHaveLength(28); // (n+1)(n+2)/2 for n = 6
    expect(TRIANGLES).toHaveLength(36); // n^2
    expect(EDGES).toHaveLength(63); // 3 * n(n+1)/2
    expect(TRIANGLE_COUNT).toBe(36);
    expect(EDGE_COUNT).toBe(63);
  });

  it('splits triangles into 21 upward and 15 downward', () => {
    expect(TRIANGLES.filter(t => t.dir === 'up')).toHaveLength(21);
    expect(TRIANGLES.filter(t => t.dir === 'down')).toHaveLength(15);
  });

  it('gives every triangle three distinct in-range edges', () => {
    for (const t of TRIANGLES) {
      const set = new Set(t.edgeIds);
      expect(set.size).toBe(3);
      for (const e of t.edgeIds) expect(e).toBeGreaterThanOrEqual(0);
      for (const e of t.edgeIds) expect(e).toBeLessThan(EDGE_COUNT);
    }
  });

  it('has 18 boundary edges (1 triangle) and 45 interior edges (2 triangles)', () => {
    const boundary = EDGES.filter(e => e.triangleIds.length === 1);
    const interior = EDGES.filter(e => e.triangleIds.length === 2);
    expect(boundary).toHaveLength(18);
    expect(interior).toHaveLength(45);
    // No edge should ever bound more than two triangles.
    expect(EDGES.every(e => e.triangleIds.length >= 1 && e.triangleIds.length <= 2)).toBe(true);
  });

  it('keeps triangle→edge and edge→triangle references consistent', () => {
    for (const t of TRIANGLES) {
      for (const e of t.edgeIds) {
        expect(EDGES[e].triangleIds).toContain(t.id);
      }
    }
    for (const e of EDGES) {
      for (const t of e.triangleIds) {
        expect(TRIANGLES[t].edgeIds).toContain(e.id);
      }
    }
  });

  it('draws every edge with the same length, so the small triangles are equilateral', () => {
    const lengths = EDGES.map(e => Math.hypot(e.x2 - e.x1, e.y2 - e.y1));
    for (const length of lengths) expect(length).toBeCloseTo(lengths[0], 2);
  });

  it('edge orbits contain the edge itself, have a size dividing 6, and are closed', () => {
    for (const edge of EDGES) {
      const orbit = edgeOrbit(edge.id);
      expect(orbit).toContain(edge.id);
      expect(6 % orbit.length).toBe(0);
      for (const image of orbit) {
        expect(new Set(edgeOrbit(image))).toEqual(new Set(orbit));
      }
    }
  });

  it('edge orbits preserve boundary vs interior', () => {
    for (const edge of EDGES) {
      for (const image of edgeOrbit(edge.id)) {
        expect(EDGES[image].triangleIds.length).toBe(edge.triangleIds.length);
      }
    }
  });

  it('lays every vertex inside the 0..100 viewBox', () => {
    for (const v of VERTICES) {
      expect(v.x).toBeGreaterThanOrEqual(0);
      expect(v.x).toBeLessThanOrEqual(100);
      expect(v.y).toBeGreaterThanOrEqual(0);
      expect(v.y).toBeLessThanOrEqual(100);
    }
  });
});
