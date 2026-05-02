import { sample } from 'lodash';

// Vertices A(0)..H(7) clockwise. Each edge = 10 km, max 4 edges/day.
// Architect wins by visiting all 8 vertices over 4 days despite 3 nightly destructions.
//
// Architect strategy (day by day):
//   Day 1: A→B→C→D→E
//   Day 2: depends on which tower was destroyed night 1
//     - A or E destroyed: E→F→G→H→A  (all 8 rebuilt)
//     - B destroyed:      E→F→G→H→A  (B still missing; end at A)
//     - C destroyed:      E→F→G→H→G  (C still missing; end at G, opposite C)
//     - D destroyed:      E→F→G→H    (D still missing; end at H, opposite D)
//   Day 3: rebuild remaining missing towers from night 2, position for day 4
//   Day 4: visit any towers destroyed on night 3 (always reachable ≤ 4 edges)

export const aiBotStrategy = ({ board, ctx, moves }) => {
  if (ctx.currentPlayer === 0) {
    const path = getOptimalArchitectPath(board);
    executeArchitectPath(path, board, moves);
  } else {
    executeBanditStrategy(board, moves);
  }
};

const executeArchitectPath = (path, board, moves) => {
  if (path.length === 0) {
    moves.endDay(board);
    return;
  }
  const [next, ...rest] = path;
  const { nextBoard } = moves.moveArchitect(board, next);
  setTimeout(() => executeArchitectPath(rest, nextBoard, moves), 600);
};

const getOptimalArchitectPath = (board) => {
  const pos = board.architectPosition;
  const towers = board.towers;
  const day = board.day;
  const missing = towers.map((t, i) => (!t ? i : null)).filter((i) => i !== null);

  if (day === 1) {
    return [1, 2, 3, 4]; // A→B→C→D→E
  }

  if (day === 2) {
    // Architect is at E(4). Find which vertex among 0-4 was destroyed night 1.
    const night1 = missing.find((v) => v <= 4);
    if (night1 === 2) return [5, 6, 7, 6]; // C: E→F→G→H→G
    if (night1 === 3) return [5, 6, 7];     // D: E→F→G→H
    return [5, 6, 7, 0];                    // A, E, B, or none: E→F→G→H→A
  }

  if (day === 3) {
    if (missing.length === 0) return []; // all 8 towers already stand; just end day

    if (missing.length === 1) {
      // All 8 were rebuilt on day 2 (A or E case); night 2 destroyed one vertex.
      // Architect is at A(0). Go to the missing vertex.
      return shortestPathTo(pos, missing[0]);
    }

    // 2 missing: one persists from night 1 (C or D), one from night 2.
    if (pos === 0) {
      // B(1) missing from night 1, architect at A. Night-2 destroyed v.
      const v = missing.find((m) => m !== 1);
      if (v === undefined) return shortestPathTo(0, 1);
      if ([0, 2, 3, 4].includes(v)) return [1, 2, 3, 4]; // A→B→C→D→E
      if (v === 5) return [1];          // A→B (end at B, opposite F)
      if (v === 6) return [1, 2];       // A→B→C (end at C, opposite G)
      return [1, 2, 3];                 // v=7: A→B→C→D (end at D, opposite H)
    }

    if (pos === 6) {
      // C(2) missing from night 1, architect at G(6).
      const v = missing.find((m) => m !== 2);
      // Path G→H→A→B→C covers {7,0,1} plus start(6); path G→F→E→D→C covers {5,4,3}
      if (v === undefined || [7, 0, 1, 6].includes(v)) return [7, 0, 1, 2];
      return [5, 4, 3, 2];
    }

    // pos === 7: D(3) missing from night 1, architect at H(7).
    const v = missing.find((m) => m !== 3);
    // Path H→A→B→C→D covers {0,1,2}; path H→G→F→E→D covers {6,5,4}
    if (v === undefined || [0, 1, 2, 7].includes(v)) return [0, 1, 2, 3];
    return [6, 5, 4, 3];
  }

  if (day === 4) {
    if (missing.length === 0) return [];

    if (missing.length === 1) {
      return shortestPathTo(pos, missing[0]);
    }

    // 2 missing: one is F/G/H (persists from night 2 in the B-case), one from night 3.
    // Architect is at B(1), C(2), or D(3) — the vertex opposite to the night-2 missing one.
    // Two equal-length paths (length 4) from pos to farMissing cover all other vertices.
    const farMissing = missing.find((v) => v >= 5); // F(5), G(6), or H(7)
    const nearMissing = missing.find((v) => v !== farMissing);

    const pathCW = clockwisePath(pos, farMissing);
    if (nearMissing === undefined || pathCW.includes(nearMissing)) return pathCW;
    return counterclockwisePath(pos, farMissing);
  }

  return [];
};

// Bandit heuristic: day 1 random (not architect's vertex), later days farthest from architect.
const executeBanditStrategy = (board, moves) => {
  const towered = board.towers.map((t, i) => (t ? i : null)).filter((i) => i !== null);
  if (towered.length === 0) return;

  if (board.day === 1) {
    const candidates = towered.filter((v) => v !== board.architectPosition);
    moves.destroyTower(board, sample(candidates.length > 0 ? candidates : towered));
    return;
  }

  const best = towered.reduce(
    (acc, v) => {
      const d = octDist(v, board.architectPosition);
      return d > acc.dist ? { v, dist: d } : acc;
    },
    { v: null, dist: -1 }
  );
  moves.destroyTower(board, best.v);
};

const octDist = (a, b) => Math.min((b - a + 8) % 8, (a - b + 8) % 8);

const directedPath = (from, to, step) => {
  const path = [];
  let cur = from;
  while (cur !== to) {
    cur = (cur + step + 8) % 8;
    path.push(cur);
  }
  return path;
};

const shortestPathTo = (from, to) => {
  if (from === to) return [];
  const step = (to - from + 8) % 8 <= (from - to + 8) % 8 ? 1 : -1;
  return directedPath(from, to, step);
};

const clockwisePath = (from, to) => directedPath(from, to, 1);

const counterclockwisePath = (from, to) => directedPath(from, to, -1);
