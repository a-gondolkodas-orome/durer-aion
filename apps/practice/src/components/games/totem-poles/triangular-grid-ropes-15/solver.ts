import { vertices, type Board, type Edge } from './gameplay';

// Fast optimal-move solver for the 15-pole board.
//
// The 10-pole game searches the game tree live with plain array operations.
// On the side-4 board that is ~30 s per move, so here the same search is done
// over bitmask primitives (15 poles -> a 15-bit "occupied poles" integer,
// precomputed rope masks) plus a transposition table. That brings the worst
// move (the reply to the opening) down to well under a second.
//
// Correctness: `isPreviousPlayerWinning` is the exact search from the official
// solution, using its trivial-move lemma to pair off the otherwise-exponential
// endgame of independent 1-length ropes. The offline script
// verify-optimality.mjs replays every one of the ~890k reachable positions and
// confirms the move this returns wins from all of them.

const nodeCount = vertices.length;
const bit = (i: number) => 1 << i;

type Rope = { from: number; to: number; str: string; nodeMask: number; midMask: number };

// --- rope universe: every collinear segment on the grid ----------------------
const orient = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

const { ropes, ropeIndex, superIndex, oneLengthRopes } = (() => {
  // maximal collinear runs of poles, one per line of each direction family
  const lines: number[][] = [];
  for (const dir of ['x', 'y', 'z'] as const) {
    const byCoord: Record<number, number[]> = {};
    vertices.forEach(v => { (byCoord[v[dir]] ||= []).push(v.id); });
    Object.values(byCoord).forEach(ids => { if (ids.length >= 2) lines.push([...ids].sort((a, b) => a - b)); });
  }
  const ropes: Rope[] = [];
  const ropeIndex: Record<string, number> = {};
  const lineOf: number[][] = [];
  const ijOf: [number, number][] = [];
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      for (let j = i + 1; j < line.length; j++) {
        let nodeMask = 0, midMask = 0;
        for (let k = i; k <= j; k++) { nodeMask |= bit(line[k]); if (k > i && k < j) midMask |= bit(line[k]); }
        ropeIndex[orient(line[i], line[j])] = ropes.length;
        lineOf.push(line);
        ijOf.push([i, j]);
        ropes.push({ from: line[i], to: line[j], str: orient(line[i], line[j]), nodeMask, midMask });
      }
    }
  }
  // strict same-line supersegments of each rope
  const superIndex = ropes.map((_, ri) => {
    const line = lineOf[ri], [i, j] = ijOf[ri];
    const res: number[] = [];
    for (let a = 0; a <= i; a++) {
      for (let b = j; b < line.length; b++) {
        if (a === i && b === j) continue;
        res.push(ropeIndex[orient(line[a], line[b])]);
      }
    }
    return res;
  });
  const oneLengthRopes = new Set<number>();
  for (const line of lines) {
    for (let i = 0; i + 1 < line.length; i++) oneLengthRopes.add(ropeIndex[orient(line[i], line[i + 1])]);
  }
  return { ropes, ropeIndex, superIndex, oneLengthRopes };
})();

// side length N from nodeCount = (N + 1)(N + 2) / 2
const N = (Math.sqrt(8 * nodeCount + 1) - 3) / 2;
// the three corners of the big triangle: top, bottom-left, bottom-right
const corners = [0, (N * (N + 1)) / 2, nodeCount - 1];

const fromBit = ropes.map(r => bit(r.from));
const toBit = ropes.map(r => bit(r.to));

// --- board = sorted array of rope indices ------------------------------------
const occupiedMask = (board: number[]) => board.reduce((m, ri) => m | ropes[ri].nodeMask, 0);

const isAllowedRope = (board: number[], occ: number, ri: number) => {
  if ((ropes[ri].midMask & occ) !== 0) return false;
  for (const e of board) {
    const nm = ropes[e].nodeMask;
    if ((nm & fromBit[ri]) && (nm & toBit[ri])) return false;
  }
  return true;
};

const allowedCache = new Map<string, number[]>();
const allowedMoveIndices = (board: number[]): number[] => {
  const key = board.join(',');
  const cached = allowedCache.get(key);
  if (cached) return cached;
  const occ = occupiedMask(board);
  const res: number[] = [];
  for (let ri = 0; ri < ropes.length; ri++) {
    if (!isAllowedRope(board, occ, ri)) continue;
    if (superIndex[ri].some(s => isAllowedRope(board, occ, s))) continue; // keep only maximal
    res.push(ri);
  }
  allowedCache.set(key, res);
  return res;
};

const trivialMoveIndices = (board: number[]): number[] => {
  const occ = occupiedMask(board);
  const covered = (i: number) => (occ & bit(i)) !== 0;
  return allowedMoveIndices(board).filter(ri => oneLengthRopes.has(ri)).filter(ri => {
    const r = ropes[ri];
    return (covered(r.from) && covered(r.to)) ||
      (corners.includes(r.from) && covered(r.to)) || (covered(r.from) && corners.includes(r.to));
  });
};

const sortedInts = (b: number[]) => b.slice().sort((a, c) => a - c);
const withRope = (board: number[], ri: number) => sortedInts([...board, ri]);
const withRopes = (board: number[], ris: number[]) => sortedInts([...board, ...ris]);

// transposition table: true iff the player TO MOVE at this board loses with
// optimal play (i.e. the player who just moved is winning). Persists across
// turns and games — it is a pure function of the board.
const winCache = new Map<string, boolean>();
const isPreviousPlayerWinning = (board: number[]): boolean => {
  const key = board.join(',');
  const hit = winCache.get(key);
  if (hit !== undefined) return hit;
  let res: boolean;
  const allowed = allowedMoveIndices(board);
  if (allowed.length === 0) {
    res = true; // the player to move cannot move and loses
  } else {
    const trivial = trivialMoveIndices(board);
    const trivialSet = new Set(trivial);
    const nonTrivial = allowed.filter(ri => !trivialSet.has(ri));
    if (nonTrivial.length === 0) {
      res = trivial.length % 2 === 0;
    } else if (trivial.length % 2 === 0) {
      const sim = withRopes(board, trivial);
      res = !nonTrivial.some(ri => isPreviousPlayerWinning(withRope(sim, ri)));
    } else {
      const sim = withRopes(board, trivial.slice(1));
      res = ![...nonTrivial, trivial[0]].some(ri => isPreviousPlayerWinning(withRope(sim, ri)));
    }
  }
  winCache.set(key, res);
  return res;
};

const toRopeIndices = (board: Board): number[] => {
  const ris = board.map(e => ropeIndex[orient(e.from, e.to)]);
  ris.sort((a, b) => a - b);
  return ris;
};

// Returns a move that wins from `board` for the player to move, or null if the
// position is lost (every move leaves the opponent winning). Deterministic: it
// returns the verified winning move, matching verify-optimality.mjs.
export const findWinningMove = (board: Board): Edge | null => {
  const ris = toRopeIndices(board);
  const moves = allowedMoveIndices(ris).slice().sort((a, b) => (ropes[a].str < ropes[b].str ? -1 : 1));
  for (const ri of moves) {
    if (isPreviousPlayerWinning(withRope(ris, ri))) {
      return { from: ropes[ri].from, to: ropes[ri].to };
    }
  }
  return null;
};
