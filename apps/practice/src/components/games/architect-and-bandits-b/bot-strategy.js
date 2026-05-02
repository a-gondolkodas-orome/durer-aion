import { sample } from 'lodash';

// Vertices A(0)..J(9) clockwise. Each edge = 10 km, max 5 edges/day.
// Architect wins by visiting all 10 vertices over 4 days despite 3 nightly destructions.
//
// Architect strategy (day by day):
//   Day 1: A→B→C→D→E→F
//   Day 2: depends on which tower was destroyed night 1
//     - A or F:  F→G→H→I→J→A  (all 10 rebuilt)
//     - B or C:  F→G→H→I→J→A  (B or C still missing; end at A)
//     - D:       F→G→H→I→J→I  (D still missing; end at I, opposite D)
//     - E:       F→G→H→I→J    (E still missing; end at J, opposite E)
//   Day 3: cover remaining missing, position for day 4
//   Day 4: visit any towers destroyed on night 3 (always reachable ≤5 edges)

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
  const missing = towers.map((t, i) => (!t ? i : null)).filter(i => i !== null);

  if (day === 1) return [1, 2, 3, 4, 5]; // A→B→C→D→E→F

  if (day === 2) {
    // Architect is at F(5). Find which vertex was destroyed night 1.
    const night1 = missing.find(v => v <= 5);
    if (night1 === 3) return [6, 7, 8, 9, 8]; // D: F→G→H→I→J→I (I opposite D)
    if (night1 === 4) return [6, 7, 8, 9];    // E: F→G→H→I→J   (J opposite E)
    return [6, 7, 8, 9, 0]; // A, F, B, C: F→G→H→I→J→A
  }

  if (day === 3) {
    if (missing.length === 0) return [];

    if (pos === 8) {
      // D was destroyed night 1; architect at I(8). missing = {D(3)} + {night2}.
      const v2 = missing.find(v => v !== 3);
      if (v2 === undefined) return shortestPathTo(8, 3);
      // CW from I covers {9,0,1,2,3}; CCW covers {7,6,5,4,3}
      if ([9, 0, 1, 2].includes(v2)) return [9, 0, 1, 2, 3]; // I→J→A→B→C→D
      return [7, 6, 5, 4, 3]; // I→H→G→F→E→D
    }

    if (pos === 9) {
      // E was destroyed night 1; architect at J(9). missing = {E(4)} + {night2}.
      const v2 = missing.find(v => v !== 4);
      if (v2 === undefined) return shortestPathTo(9, 4);
      // CW from J covers {0,1,2,3,4}; CCW covers {8,7,6,5,4}
      if ([0, 1, 2, 3].includes(v2)) return [0, 1, 2, 3, 4]; // J→A→B→C→D→E
      return [8, 7, 6, 5, 4]; // J→I→H→G→F→E
    }

    // pos === 0: A/F case (1 missing) or B/C case (2 missing)
    if (missing.length === 1) {
      // A or F destroyed night 1; all 10 towers rebuilt by end of day 2.
      return shortestPathTo(0, missing[0]);
    }

    // B or C destroyed night 1; architect at A(0).
    // missing = {bc_missing ∈ {1,2}} + {v2 = night2 target}
    const bc_missing = missing.find(v => v === 1 || v === 2);
    const v2 = missing.find(v => v !== bc_missing);

    if (v2 === undefined || v2 <= 5) {
      return [1, 2, 3, 4, 5]; // A→B→C→D→E→F covers all 0-5
    }

    // v2 ∈ {6,7,8,9}: position at opp=(v2+5)%10, which is in {1,2,3,4}
    const opp = (v2 + 5) % 10;
    // Special case: v2=G(6), opp=B(1), bc_missing=C(2): must backtrack A→B→C→B
    if (v2 === 6 && bc_missing === 2) return [1, 2, 1];
    // Otherwise CW from A to opp covers bc_missing along the way (bc_missing ≤ opp)
    return clockwisePath(0, opp);
  }

  if (day === 4) {
    if (missing.length === 0) return [];
    if (missing.length === 1) return shortestPathTo(pos, missing[0]);

    // 2 missing: one far vertex (5 steps away, from B/C+G/H/I/J case), one from night 3.
    const farV = missing.find(v => decDist(pos, v) === 5) ?? missing[0];
    const nearV = missing.find(v => v !== farV);

    const pathCW = clockwisePath(pos, farV);
    if (nearV === undefined || pathCW.includes(nearV)) return pathCW;
    return counterclockwisePath(pos, farV);
  }

  return [];
};

// Bandit heuristic: day 1 random; later days pick the tower that maximises the
// minimum path the architect needs to cover all missing+newly-destroyed vertices.
// Destroying the architect's current position is excluded: startNextDay rebuilds it for free.
const executeBanditStrategy = (board, moves) => {
  const pos = board.architectPosition;
  const candidates = board.towers
    .map((t, i) => (t && i !== pos ? i : null))
    .filter(i => i !== null);
  if (candidates.length === 0) return;

  if (board.day === 1) {
    moves.destroyTower(board, sample(candidates));
    return;
  }

  const missing = board.towers
    .map((t, i) => (!t && i !== pos ? i : null))
    .filter(i => i !== null);

  const best = candidates.reduce(
    (acc, v) => {
      const pathLen = minPathToVisitAll(pos, [...missing, v]);
      return pathLen > acc.len ? { v, len: pathLen } : acc;
    },
    { v: null, len: -1 }
  );
  moves.destroyTower(board, best.v);
};

// Minimum moves to visit all targets from pos on a 10-cycle.
// Tries all k+1 arc splits: j targets covered going CW, the rest going CCW.
const minPathToVisitAll = (pos, targets) => {
  if (targets.length === 0) return 0;
  const cwDists = targets.map(v => (v - pos + 10) % 10).sort((a, b) => a - b);
  const k = cwDists.length;
  let best = Infinity;
  for (let j = 0; j <= k; j++) {
    const cwReach = j > 0 ? cwDists[j - 1] : 0;
    const ccwReach = j < k ? 10 - cwDists[j] : 0;
    const cost = cwReach === 0 ? ccwReach
      : ccwReach === 0 ? cwReach
        : Math.min(2 * cwReach + ccwReach, cwReach + 2 * ccwReach);
    best = Math.min(best, cost);
  }
  return best;
};

const directedPath = (from, to, step) => {
  const path = [];
  let cur = from;
  while (cur !== to) {
    cur = (cur + step + 10) % 10;
    path.push(cur);
  }
  return path;
};

const shortestPathTo = (from, to) => {
  if (from === to) return [];
  const step = (to - from + 10) % 10 <= (from - to + 10) % 10 ? 1 : -1;
  return directedPath(from, to, step);
};

const clockwisePath = (from, to) => directedPath(from, to, 1);

const counterclockwisePath = (from, to) => directedPath(from, to, -1);
