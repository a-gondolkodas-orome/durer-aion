import { EDGES, TRIANGLE_COUNT, edgeOrbit } from '../geometry';
import { type Board, applyShade, applyCircle, shadedCount } from '../helpers';

// The line player's proven forced win on the side-6 board, built on two facts.
//
// Call an uncircled triangle HOT if exactly 1 of its sides is shaded, COLD if 0,
// and let the FREE-GRAPH have the uncircled triangles as vertices and the
// unshaded shared sides as edges.
//
// March Lemma: if at the line player's turn two hot triangles lie in the same
// free-graph component, line wins. Take the closest hot pair; the shortest path
// between them has cold interior. Shading the first path edge lifts the front
// triangle to 2 sides — a completion threat the circle player must cover — and
// heats the next path cell. Every step is forced; the last shade lifts TWO
// triangles to 2 sides at once, circle covers one, line completes the other.
//
// Winning plan (side 6): the free-graph's core is far from a tree (around each
// interior lattice point the six triangles form a ring, and two adjacent cells
// lie on two such rings), so no single circled cell can separate two central
// hot triangles. Line shades a central interior edge, heating both sides; the
// circle player is forced to circle one of the two hot cells (anything else
// leaves two connected hots — March Lemma). Line then pair-heats again, spread
// out, leaving three hots no single reply can split; two survive, and the march
// finishes the game.
//
// This plan is CERTIFIED by `forced-win.spec.ts`: from the empty board, after
// OPENING_EDGE, for every one of the 36 circle replies either the position is
// already two-hot or a second pair-heat exists after which ALL circle replies
// leave a two-hot position — a complete-branching, two-move-deep certificate.
// (The same check run on side 2 and 3 boards fails, as it must: the exact
// solver shows the circle player wins those, the free-graph being near-tree.)

// The certified opening: the central interior edge between the row-4 up
// triangle and the down triangle below it (id in geometry.ts numbering).
export const OPENING_EDGE = 22;

// Its full symmetry orbit: by the board's symmetries every image is an equally
// winning opening (the certificate spec re-checks each one), and the bot varies
// among them instead of always playing the same first move.
export const OPENING_EDGES: number[] = edgeOrbit(OPENING_EDGE);

// A triangle's heat: -1 once circled (out of the game), else its number of
// shaded sides — 0 is cold, 1 is hot, 2+ is completable.
const heat = (board: Board, t: number): number =>
  board.circles[t] ? -1 : shadedCount(board, t);

// True iff the player to move being LINE wins outright: an uncircled triangle
// already has 2 shaded sides (complete it), or two hot triangles share a
// free-graph component (March Lemma).
export const isLineTurnWon = (board: Board): boolean => {
  const counts: number[] = new Array(TRIANGLE_COUNT);
  for (let t = 0; t < TRIANGLE_COUNT; t++) {
    counts[t] = heat(board, t);
    if (counts[t] >= 2) return true;
  }
  const parent = Array.from({ length: TRIANGLE_COUNT }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const edge of EDGES) {
    if (board.edges[edge.id] || edge.triangleIds.length !== 2) continue;
    const [a, b] = edge.triangleIds;
    if (board.circles[a] || board.circles[b]) continue;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }
  const hotRoots = new Set<number>();
  for (let t = 0; t < TRIANGLE_COUNT; t++) {
    if (counts[t] !== 1) continue;
    const root = find(t);
    if (hotRoots.has(root)) return true;
    hotRoots.add(root);
  }
  return false;
};

// Every candidate next march step from a two-hot position: the free edges
// between adjacent hot pairs (instant double threats) or, failing that, the
// first edge of a cold path from each hot toward another hot in its component.
// Empty if no two-hot pattern exists. Each candidate is equally winning (the
// March Lemma argument applies to any hot pair), so the bot samples among them.
export const marchEdges = (board: Board): number[] => {
  const counts: number[] = [];
  const hots: number[] = [];
  for (let t = 0; t < TRIANGLE_COUNT; t++) {
    counts[t] = heat(board, t);
    if (counts[t] === 1) hots.push(t);
  }
  if (hots.length < 2) return [];
  const hotSet = new Set(hots);

  const adjacency: { cell: number; edge: number }[][] =
    Array.from({ length: TRIANGLE_COUNT }, () => []);
  for (const edge of EDGES) {
    if (board.edges[edge.id] || edge.triangleIds.length !== 2) continue;
    const [a, b] = edge.triangleIds;
    if (board.circles[a] || board.circles[b]) continue;
    adjacency[a].push({ cell: b, edge: edge.id });
    adjacency[b].push({ cell: a, edge: edge.id });
  }

  // Two hots sharing a free edge: shading it is an immediate double threat.
  const shared = new Set<number>();
  for (const h of hots) {
    for (const { cell, edge } of adjacency[h]) {
      if (hotSet.has(cell)) shared.add(edge);
    }
  }
  if (shared.size > 0) return [...shared];

  // Otherwise BFS from a hot through cold cells toward another hot; the first
  // edge of the found path is the forcing shade.
  const pathStart = (h: number): number | null => {
    const visited = new Set<number>([h]);
    const queue: { cell: number; firstEdge: number }[] = [];
    for (const { cell, edge } of adjacency[h]) {
      if (counts[cell] === 0) {
        visited.add(cell);
        queue.push({ cell, firstEdge: edge });
      }
    }
    while (queue.length > 0) {
      const { cell, firstEdge } = queue.shift()!;
      for (const { cell: next } of adjacency[cell]) {
        // Another hot reached (never the source itself — walking back to h via
        // a neighbour is not a path to a second hot).
        if (next !== h && hotSet.has(next)) return firstEdge;
        if (counts[next] === 0 && !visited.has(next)) {
          visited.add(next);
          queue.push({ cell: next, firstEdge });
        }
      }
    }
    return null;
  };

  const firstEdges = new Set<number>();
  for (const h of hots) {
    const e = pathStart(h);
    if (e !== null) firstEdges.add(e);
  }
  return [...firstEdges];
};

// Every pair-heat (free interior edge, both sides cold and uncircled) after
// which EVERY circle reply leaves a two-hot / immediately-won position for
// line — the runtime form of the certificate's second move. Each returned edge
// is winning on its own, so the bot samples among them.
export const winningPairHeatEdges = (board: Board): number[] => {
  const uncircled: number[] = [];
  for (let t = 0; t < TRIANGLE_COUNT; t++) if (!board.circles[t]) uncircled.push(t);
  if (uncircled.length === 0) return [];

  const winning: number[] = [];
  for (const edge of EDGES) {
    if (board.edges[edge.id] || edge.triangleIds.length !== 2) continue;
    const [a, b] = edge.triangleIds;
    if (heat(board, a) !== 0 || heat(board, b) !== 0) continue;
    const shaded = applyShade(board, edge.id);
    let allRepliesLose = true;
    for (const t of uncircled) {
      if (!isLineTurnWon(applyCircle(shaded, t))) {
        allRepliesLose = false;
        break;
      }
    }
    if (allRepliesLose) winning.push(edge.id);
  }
  return winning;
};
