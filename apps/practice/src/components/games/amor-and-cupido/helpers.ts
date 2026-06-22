// Triangle achievement game on the complete graph K6 (6 people, 15 possible
// pairs/edges). Each edge is owned by player 0, player 1, or nobody (null).
// A player wins by owning all three edges of one of the 20 triangles.

export type Board = (number | null)[];

const VERTEX_COUNT = 6;

// The 15 edges as vertex pairs [a, b] with a < b, indexed 0..14.
export const EDGES: [number, number][] = [];
// edgeIndex[a][b] === edgeIndex[b][a] === index of that edge in EDGES.
export const edgeIndex: number[][] =
  Array.from({ length: VERTEX_COUNT }, () => Array(VERTEX_COUNT).fill(-1));

for (let a = 0; a < VERTEX_COUNT; a++) {
  for (let b = a + 1; b < VERTEX_COUNT; b++) {
    const i = EDGES.length;
    EDGES.push([a, b]);
    edgeIndex[a][b] = i;
    edgeIndex[b][a] = i;
  }
}

// The C(6,3) = 20 triangles, each as its three edge indices.
export const TRIANGLES: [number, number, number][] = [];
for (let a = 0; a < VERTEX_COUNT; a++) {
  for (let b = a + 1; b < VERTEX_COUNT; b++) {
    for (let c = b + 1; c < VERTEX_COUNT; c++) {
      TRIANGLES.push([edgeIndex[a][b], edgeIndex[a][c], edgeIndex[b][c]]);
    }
  }
}

// For each edge, the triangles that contain it (used for the win check).
const trianglesByEdge: [number, number, number][][] =
  EDGES.map((_, e) => TRIANGLES.filter(tri => tri.includes(e)));

export const generateStartBoard = (): Board => new Array(EDGES.length).fill(null);

export const getAllowedMoves = (board: Board): number[] =>
  board.flatMap((owner, e) => (owner === null ? [e] : []));

// Would claiming `edge` for `player` complete a triangle entirely in their
// colour? A move can only ever complete the mover's own triangle (you only add
// to your own colour), so this is the single win condition. `edge` itself is
// assumed not yet owned; we only check its two partner edges in each triangle.
export const completesTriangle = (board: Board, player: number, edge: number): boolean =>
  trianglesByEdge[edge].some(tri =>
    tri.every(e => e === edge || board[e] === player)
  );

// The edges of a triangle fully owned by `player`, or null if none — used to
// highlight the winning triangle once the game is over.
export const findWinningTriangle = (board: Board, player: number): number[] | null =>
  TRIANGLES.find(tri => tri.every(e => board[e] === player)) ?? null;

// --- Isomorphism canonicalisation ----------------------------------------
// K6 has 720 vertex permutations; the game value of a position is invariant
// under them. We map each position to a canonical key so the solver explores
// each position only once (up to relabelling), keeping the search instant and
// the memo small.

const permutations = (arr: number[]): number[][] => {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((v, i) =>
    permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(rest => [v, ...rest])
  );
};

// For each vertex permutation p, EDGE_PERMS[p][e] is the index of the edge that
// edge e maps to under p.
const EDGE_PERMS: number[][] = permutations([0, 1, 2, 3, 4, 5]).map(p =>
  EDGES.map(([a, b]) => edgeIndex[p[a]][p[b]])
);

const encode = (board: Board): string =>
  board.map(v => (v === null ? '.' : v)).join('');

export const canonicalKey = (board: Board, toMove: number): string => {
  let best: string | null = null;
  for (const perm of EDGE_PERMS) {
    const remapped: Board = new Array(EDGES.length);
    for (let e = 0; e < EDGES.length; e++) remapped[perm[e]] = board[e];
    const key = encode(remapped);
    if (best === null || key < best) best = key;
  }
  return best + '|' + toMove;
};
