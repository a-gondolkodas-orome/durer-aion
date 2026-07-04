// Modified Petersen graph: the standard Petersen graph (outer 5-cycle, inner
// pentagram, 5 spokes) with each of the 5 outer edges subdivided by an extra
// node. 15 vertices in total:
//   O0..O4  (0..4)   original outer pentagon corners
//   M0..M4  (5..9)   Mi subdivides the outer edge Oi--O(i+1)
//   I0..I4  (10..14) inner pentagram; Ii ~ I(i+2) and I(i-2), spoke Oi--Ii
export const neighbours: Record<number, number[]> = {
  0: [9, 5, 10],
  1: [5, 6, 11],
  2: [6, 7, 12],
  3: [7, 8, 13],
  4: [8, 9, 14],
  5: [0, 1],
  6: [1, 2],
  7: [2, 3],
  8: [3, 4],
  9: [4, 0],
  10: [0, 12, 13],
  11: [1, 13, 14],
  12: [2, 14, 10],
  13: [3, 10, 11],
  14: [4, 11, 12]
};

export const VERTEX_COUNT = 15;

// SVG coordinates in a 0..100 viewBox (canonical symmetric Petersen embedding).
export const coords: { x: number; y: number }[] = [
  { x: 50.0, y: 8.0 },  // O0
  { x: 89.9, y: 37.0 }, // O1
  { x: 74.7, y: 84.0 }, // O2
  { x: 25.3, y: 84.0 }, // O3
  { x: 10.1, y: 37.0 }, // O4
  { x: 70.0, y: 22.5 }, // M0
  { x: 82.3, y: 60.5 }, // M1
  { x: 50.0, y: 84.0 }, // M2
  { x: 17.7, y: 60.5 }, // M3
  { x: 30.0, y: 22.5 }, // M4
  { x: 50.0, y: 33.0 }, // I0
  { x: 66.2, y: 44.7 }, // I1
  { x: 60.0, y: 63.8 }, // I2
  { x: 40.0, y: 63.8 }, // I3
  { x: 33.8, y: 44.7 }  // I4
];

// Unique undirected edges, derived once from the adjacency list.
export const edges: [number, number][] = (() => {
  const seen = new Set<string>();
  const list: [number, number][] = [];
  for (let v = 0; v < VERTEX_COUNT; v++) {
    for (const u of neighbours[v]) {
      const key = v < u ? `${v}-${u}` : `${u}-${v}`;
      if (!seen.has(key)) { seen.add(key); list.push([v, u]); }
    }
  }
  return list;
})();

// All-pairs shortest-path distances (BFS), computed once. Used only by bot
// heuristics for pressuring/evading in already-decided positions.
export const dist: number[][] = (() => {
  const d: number[][] = [];
  for (let s = 0; s < VERTEX_COUNT; s++) {
    const row = new Array(VERTEX_COUNT).fill(Infinity);
    row[s] = 0;
    const queue = [s];
    while (queue.length) {
      const v = queue.shift()!;
      for (const u of neighbours[v]) {
        if (row[u] === Infinity) { row[u] = row[v] + 1; queue.push(u); }
      }
    }
    d.push(row);
  }
  return d;
})();

export const minDistToSet = (vertex: number, set: number[]): number =>
  Math.min(...set.map((c) => dist[vertex][c]));
