// Static geometry of the side-6 triangular grid the game is played on.
//
// A side-n triangle subdivided into unit triangles has n rows of small
// triangles; row r (1-based, from the top) holds r upward-pointing and r-1
// downward-pointing triangles. For n = 6 this yields 36 triangles, 28 lattice
// vertices and 63 edges (18 on the boundary, 45 interior/shared). Everything the
// board and the bot reason about (which edges bound which triangle, where to
// draw each shape) is derived once, here, from that lattice — nothing is
// hand-transcribed, so the counts can't silently drift.

const GRID_SIZE = 6;
export const TRIANGLE_COUNT = 36;
export const EDGE_COUNT = 63;

export interface Vertex { id: number; x: number; y: number }
export interface Triangle {
  id: number;
  dir: 'up' | 'down';
  vertexIds: [number, number, number];
  edgeIds: [number, number, number];
  points: string; // "x,y x,y x,y" for the SVG <polygon>
  cx: number; // centroid, where a circle is drawn
  cy: number;
}
export interface Edge {
  id: number;
  x1: number; y1: number;
  x2: number; y2: number;
  triangleIds: number[]; // the 1 (boundary) or 2 (interior) triangles it bounds
}

// Vertex id within the lattice: rows 0..n from the top, row r holding r+1
// vertices. Ids are assigned row by row, left to right.
const vertexId = (row: number, col: number): number => (row * (row + 1)) / 2 + col;

// Lay the lattice out inside the 0..100 SVG viewBox: apex at the top-centre,
// columns 14 units apart and rows 14·√3/2 apart so every small triangle is
// equilateral; the base spans x = 8..92 and the board is centred vertically.
const COL_WIDTH = 14;
const ROW_HEIGHT = (COL_WIDTH * Math.sqrt(3)) / 2;
const TOP_Y = 50 - (GRID_SIZE * ROW_HEIGHT) / 2;
const CENTER_X = 50;

const buildVertices = (): Vertex[] => {
  const vertices: Vertex[] = [];
  for (let row = 0; row <= GRID_SIZE; row++) {
    for (let col = 0; col <= row; col++) {
      vertices.push({
        id: vertexId(row, col),
        x: Math.round((CENTER_X + (col - row / 2) * COL_WIDTH) * 1000) / 1000,
        y: Math.round((TOP_Y + row * ROW_HEIGHT) * 1000) / 1000
      });
    }
  }
  return vertices;
};

export const VERTICES: Vertex[] = buildVertices();

const edgeKey = (a: number, b: number): string => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Build triangles and, as a side effect, intern each distinct edge so shared
// edges get a single id referenced by both adjacent triangles.
const build = () => {
  const edgeByKey = new Map<string, Edge>();
  const edges: Edge[] = [];
  const edgeVertexIds: [number, number][] = [];

  const internEdge = (a: number, b: number): number => {
    const key = edgeKey(a, b);
    const existing = edgeByKey.get(key);
    if (existing) return existing.id;
    const va = VERTICES[a];
    const vb = VERTICES[b];
    const edge: Edge = {
      id: edges.length,
      x1: va.x,
      y1: va.y,
      x2: vb.x,
      y2: vb.y,
      triangleIds: []
    };
    edgeByKey.set(key, edge);
    edges.push(edge);
    edgeVertexIds.push(a < b ? [a, b] : [b, a]);
    return edge.id;
  };

  const triangles: Triangle[] = [];
  const addTriangle = (dir: 'up' | 'down', vertexIds: [number, number, number]) => {
    const [a, b, c] = vertexIds;
    const edgeIds: [number, number, number] = [
      internEdge(a, b),
      internEdge(b, c),
      internEdge(a, c)
    ];
    const [va, vb, vc] = [VERTICES[a], VERTICES[b], VERTICES[c]];
    const triangle: Triangle = {
      id: triangles.length,
      dir,
      vertexIds,
      edgeIds,
      points: `${va.x},${va.y} ${vb.x},${vb.y} ${vc.x},${vc.y}`,
      cx: (va.x + vb.x + vc.x) / 3,
      cy: (va.y + vb.y + vc.y) / 3
    };
    triangles.push(triangle);
    edgeIds.forEach(e => edges[e].triangleIds.push(triangle.id));
  };

  for (let row = 1; row <= GRID_SIZE; row++) {
    for (let col = 0; col < row; col++) {
      // Upward triangle: apex on the row above, base on this row.
      addTriangle('up', [vertexId(row - 1, col), vertexId(row, col), vertexId(row, col + 1)]);
    }
    for (let col = 0; col < row - 1; col++) {
      // Downward triangle: base on the row above, apex on this row.
      addTriangle('down', [vertexId(row - 1, col), vertexId(row - 1, col + 1), vertexId(row, col + 1)]);
    }
  }

  return { triangles, edges, edgeVertexIds, edgeByKey };
};

const built = build();

export const TRIANGLES: Triangle[] = built.triangles;
export const EDGES: Edge[] = built.edges;

// --- Board symmetries ------------------------------------------------------
//
// A vertex at (row, col) is described by the triple
// (row - col, col, GRID_SIZE - row) — its lattice distances from the three
// sides of the big triangle — and the board's six symmetries (identity, two
// rotations, three reflections) are exactly the permutations of that triple.

const VERTEX_TRIPLES: [number, number, number][] = [];
for (let row = 0; row <= GRID_SIZE; row++) {
  for (let col = 0; col <= row; col++) VERTEX_TRIPLES.push([row - col, col, GRID_SIZE - row]);
}

const PERMUTATIONS: [number, number, number][] = [
  [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]
];

const mapVertex = (id: number, perm: [number, number, number]): number => {
  const triple = VERTEX_TRIPLES[id];
  return vertexId(GRID_SIZE - triple[perm[2]], triple[perm[1]]);
};

// All images of an edge under the six board symmetries (its orbit, which
// includes the edge itself). Symmetric edges are strategically interchangeable,
// so a bot may pick among them freely.
export const edgeOrbit = (edgeId: number): number[] => {
  const [a, b] = built.edgeVertexIds[edgeId];
  const orbit = new Set<number>();
  for (const perm of PERMUTATIONS) {
    orbit.add(built.edgeByKey.get(edgeKey(mapVertex(a, perm), mapVertex(b, perm)))!.id);
  }
  return [...orbit];
};

// Outline of the whole board, for the bounding stroke.
export const BOARD_OUTLINE = [
  VERTICES[vertexId(0, 0)],
  VERTICES[vertexId(GRID_SIZE, 0)],
  VERTICES[vertexId(GRID_SIZE, GRID_SIZE)]
].map(v => `${v.x},${v.y}`).join(' ');
