import { EDGES, TRIANGLES, TRIANGLE_COUNT, EDGE_COUNT } from '../geometry';
import { type Board, LINE, CIRCLE } from '../helpers';

// Bounded-depth minimax over the threat-reduced game — the runtime, tractable
// form of the exact solver (which is only feasible for tiny boards, where it
// shows the circle player wins side <= 3). On the real side-6 board the LINE
// player has a proven forced win (see forced-win.ts), so this search now serves
// the circle side's defence and any position outside the certified line.
// It answers, within a node budget and depth horizon, a 3-valued question:
//
//   'lineWins'  — the line player has a forced win (proven inside the horizon)
//   'lineLoses' — the line player provably cannot win inside the horizon
//   'unknown'   — undecided within the budget/horizon
//
// The bot uses it to always grab a forced win, always refuse a move that hands
// the opponent a forced win, and defer to the heuristic only where the outcome
// is genuinely unknown. It leans on the reduction (a double threat is an instant
// line win; a lone threat forces the circle player's reply) to see far along
// forced lines cheaply.

export type Outcome = 'lineWins' | 'lineLoses' | 'unknown';

// Precomputed bit machinery. Edges (up to 63) and triangles (36) live in BigInt
// masks so a whole position is two integers.
const TRI_EDGE_IDS: number[][] = TRIANGLES.map(t => [...t.edgeIds]);
const EDGE_TRI_IDS: number[][] = EDGES.map(e => [...e.triangleIds]);
const ALL_CIRCLES = (1n << BigInt(TRIANGLE_COUNT)) - 1n;

const boardToMasks = (board: Board): { edges: bigint; circles: bigint } => {
  let edges = 0n;
  for (let e = 0; e < EDGE_COUNT; e++) if (board.edges[e]) edges |= 1n << BigInt(e);
  let circles = 0n;
  for (let t = 0; t < TRIANGLE_COUNT; t++) if (board.circles[t]) circles |= 1n << BigInt(t);
  return { edges, circles };
};

const bit = (i: number): bigint => 1n << BigInt(i);
const has = (mask: bigint, i: number): boolean => (mask & bit(i)) !== 0n;

const shadedEdges = (edges: bigint, t: number): number => {
  const [a, b, c] = TRI_EDGE_IDS[t];
  return (has(edges, a) ? 1 : 0) + (has(edges, b) ? 1 : 0) + (has(edges, c) ? 1 : 0);
};

interface SearchState {
  nodes: number;
  budget: number;
  memo: Map<string, Outcome>;
}

// Free edges of the board (line player's options).
const freeEdgeList = (edges: bigint): number[] => {
  const list: number[] = [];
  for (let e = 0; e < EDGE_COUNT; e++) if (!has(edges, e)) list.push(e);
  return list;
};

// Un-circled triangles with exactly two shaded edges: the line player completes
// any of these next move.
const threatList = (edges: bigint, circles: bigint): number[] => {
  const list: number[] = [];
  for (let t = 0; t < TRIANGLE_COUNT; t++) {
    if (!has(circles, t) && shadedEdges(edges, t) === 2) list.push(t);
  }
  return list;
};

// Interior free edges whose both triangles are un-circled 1-edge triangles:
// shading one makes a double threat, so circling one of their triangles is the
// natural circle-player defence. Used only for move ordering.
const preThreatTriangles = (edges: bigint, circles: bigint): Set<number> => {
  const set = new Set<number>();
  for (let e = 0; e < EDGE_COUNT; e++) {
    if (has(edges, e)) continue;
    const tris = EDGE_TRI_IDS[e];
    if (tris.length === 2 && tris.every(t => !has(circles, t) && shadedEdges(edges, t) === 1)) {
      tris.forEach(t => set.add(t));
    }
  }
  return set;
};

const search = (edges: bigint, circles: bigint, player: number, depth: number, st: SearchState): Outcome => {
  st.nodes++;
  if (circles === ALL_CIRCLES) return 'lineLoses'; // every triangle circled → circle wins
  if (st.nodes > st.budget || depth <= 0) return 'unknown';

  // The key deliberately omits the remaining depth, so an 'unknown' cached from
  // a shallow visit can short-circuit a later, deeper visit of the same
  // position. That only ever makes the search more conservative ('lineWins' /
  // 'lineLoses' are depth-independent proofs) and keeps the memo effective
  // within the node budget.
  const key = `${edges.toString(36)}|${circles.toString(36)}|${player}`;
  const cached = st.memo.get(key);
  if (cached) return cached;

  let result: Outcome;

  if (player === LINE) {
    const free = freeEdgeList(edges);

    // Immediate win: complete an un-circled 2-edge triangle right now.
    const immediate = free.some(e =>
      EDGE_TRI_IDS[e].some(t => !has(circles, t) && shadedEdges(edges, t) === 2)
    );
    if (immediate) { st.memo.set(key, 'lineWins'); return 'lineWins'; }

    // Double threat: a move leaving ≥2 live threats is a forced win next turn.
    for (const e of free) {
      const next = edges | bit(e);
      let threats = 0;
      for (let t = 0; t < TRIANGLE_COUNT; t++) {
        if (!has(circles, t) && shadedEdges(next, t) === 2) { threats++; if (threats >= 2) break; }
      }
      if (threats >= 2) { st.memo.set(key, 'lineWins'); return 'lineWins'; }
    }

    // Order moves by how many threats they create, so wins/refutations surface early.
    const ordered = free
      .map(e => {
        const next = edges | bit(e);
        let threats = 0;
        for (const t of EDGE_TRI_IDS[e]) if (!has(circles, t) && shadedEdges(next, t) === 2) threats++;
        return { e, threats };
      })
      .sort((x, y) => y.threats - x.threats);

    let allLoses = true;
    result = 'unknown';
    for (const { e } of ordered) {
      const child = search(edges | bit(e), circles, CIRCLE, depth - 1, st);
      if (child === 'lineWins') { result = 'lineWins'; allLoses = false; break; }
      if (child !== 'lineLoses') allLoses = false;
    }
    if (result !== 'lineWins') result = allLoses ? 'lineLoses' : 'unknown';
  } else {
    const threats = threatList(edges, circles);

    // Two live threats and it's the circle player's move → line already won.
    if (threats.length >= 2) { st.memo.set(key, 'lineWins'); return 'lineWins'; }

    if (threats.length === 1) {
      // Forced reply: cover the sole threat. A forced move doesn't consume depth,
      // so we can follow long forcing lines to their real resolution.
      result = search(edges, circles | bit(threats[0]), LINE, depth, st);
    } else {
      // Free choice: circle any triangle. Circle wins the argument if *some* reply
      // proves 'lineLoses'; it's a line win only if *every* reply is 'lineWins'.
      const pre = preThreatTriangles(edges, circles);
      const candidates: number[] = [];
      for (let t = 0; t < TRIANGLE_COUNT; t++) if (!has(circles, t)) candidates.push(t);
      candidates.sort((a, b) => (pre.has(b) ? 1 : 0) - (pre.has(a) ? 1 : 0));

      let allWins = true;
      result = 'unknown';
      for (const t of candidates) {
        const child = search(edges, circles | bit(t), LINE, depth - 1, st);
        if (child === 'lineLoses') { result = 'lineLoses'; allWins = false; break; }
        if (child !== 'lineWins') allWins = false;
      }
      if (result !== 'lineLoses') result = allWins ? 'lineWins' : 'unknown';
    }
  }

  st.memo.set(key, result);
  return result;
};

// Public entry: evaluate a position (with `player` to move) within a depth
// horizon and node budget.
export const evaluatePosition = (
  board: Board,
  player: number,
  { depth = 8, budget = 120_000 }: { depth?: number; budget?: number } = {}
): Outcome => {
  const { edges, circles } = boardToMasks(board);
  const st: SearchState = { nodes: 0, budget, memo: new Map() };
  return search(edges, circles, player, depth, st);
};

// Evaluate the position that results from a single move, reusing one budget/memo
// across many candidate moves (so earlier, better-ordered candidates get the
// most search and later ones benefit from the shared memo).
export interface MoveEvaluator {
  evalAfterShade: (board: Board, edgeId: number) => Outcome;
  evalAfterCircle: (board: Board, triangleId: number) => Outcome;
}

export const makeMoveEvaluator = (
  { depth, budget }: { depth: number; budget: number }
): MoveEvaluator => {
  const st: SearchState = { nodes: 0, budget, memo: new Map() };
  return {
    evalAfterShade: (board, edgeId) => {
      const { edges, circles } = boardToMasks(board);
      return search(edges | bit(edgeId), circles, CIRCLE, depth, st);
    },
    evalAfterCircle: (board, triangleId) => {
      const { edges, circles } = boardToMasks(board);
      return search(edges, circles | bit(triangleId), LINE, depth, st);
    }
  };
};
