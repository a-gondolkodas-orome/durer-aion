'use strict';

/*
  Regenerates modified-mill's strategy.json — the first player's complete
  winning strategy.

  Run with:  node scripts/pre-generate-ai-moves/modified-mill-strategy.cjs

  THE GAME. Two players alternately place discs on a 24-cell board: three
  concentric squares whose CORNERS are joined across squares by four corner
  diagonals (edge-midpoints connect only within their own square — there are no
  radial spokes). Whoever first owns three cells of a line wins; a full board
  with no line goes to the second player. There are 16 lines: 12 square sides
  plus 4 corner diagonals.

  WHO WINS. Solving the game exactly shows the FIRST player wins, so only their
  side needs a table — the second player has no forced win and bot-strategy.ts
  plays a heuristic there instead.

  WHY A TABLE. The exact solve takes several seconds from the empty board, far
  too slow for a first move in the browser. But the winning strategy itself is
  tiny: the bot only ever visits positions reachable while following its own
  advice, so we store just those (a few hundred), not the whole state space.

  SYMMETRY. Positions are keyed by their canonical form under the board's 8
  dihedral symmetries, which shrinks both the solve and the table by ~8x. The
  stored move is expressed in the canonical frame; bot-strategy.ts maps it back
  through the inverse permutation (see canonicalize/invertPerm there). The
  geometry below is derived rather than copied, but it still has to agree with
  board-data.ts: if you change the board here, regenerate that file too (it is
  printed at the end for exactly that purpose).

  VERIFICATION. After building the table the script replays it against EVERY
  possible opponent line and asserts the first player always completes a line
  first — never loses, never reaches a full board. That exhaustive check is the
  real guarantee of optimality, and it is why this script throws rather than
  writing a table it could not prove correct.
*/

const fs = require('fs');
const path = require('path');

// --- Board geometry (mirrors board-data.ts; indices must match) ---------------
// Cells sit on a 7x7 grid so all three squares share the centre (3,3).
const RINGS = [
  { corners: [[0, 0], [6, 0], [6, 6], [0, 6]], mids: [[3, 0], [6, 3], [3, 6], [0, 3]] },
  { corners: [[1, 1], [5, 1], [5, 5], [1, 5]], mids: [[3, 1], [5, 3], [3, 5], [1, 3]] },
  { corners: [[2, 2], [4, 2], [4, 4], [2, 4]], mids: [[3, 2], [4, 3], [3, 4], [2, 3]] }
];

const COORDS = [];
for (const ring of RINGS) for (const cell of [...ring.corners, ...ring.mids]) COORDS.push(cell);
const CELL_COUNT = COORDS.length; // 24
const indexOf = (cell) => COORDS.findIndex(([x, y]) => x === cell[0] && y === cell[1]);

const LINES = [];
// 12 square sides: corner - edge-midpoint - next corner, around each square.
for (const { corners, mids } of RINGS) {
  for (let i = 0; i < 4; i++) LINES.push([corners[i], mids[i], corners[(i + 1) % 4]]);
}
// 4 corner diagonals: the same corner of the outer, middle and inner square.
for (let i = 0; i < 4; i++) LINES.push(RINGS.map((ring) => ring.corners[i]));

const LINE_INDICES = LINES.map((line) => line.map(indexOf));
const LINE_MASKS = LINE_INDICES.map((line) => line.reduce((mask, i) => mask | (1 << i), 0));
const FULL = (1 << CELL_COUNT) - 1;

const linesThrough = COORDS.map((_, node) => LINE_MASKS.filter((mask) => mask & (1 << node)));

// The 8 symmetries of a square, as matrices acting about the centre (3,3).
const TRANSFORMS = [
  [1, 0, 0, 1], [0, -1, 1, 0], [-1, 0, 0, -1], [0, 1, -1, 0], // rotations
  [-1, 0, 0, 1], [1, 0, 0, -1], [0, 1, 1, 0], [0, -1, -1, 0] //  reflections
];
const SYMMETRIES = TRANSFORMS.map(([a, b, c, d]) =>
  COORDS.map(([x, y]) => indexOf([a * (x - 3) + b * (y - 3) + 3, c * (x - 3) + d * (y - 3) + 3]))
);

// --- Bit helpers ---------------------------------------------------------------
const cellsOf = (mask) => {
  const cells = [];
  for (let rest = mask; rest; rest &= rest - 1) cells.push(31 - Math.clz32(rest & -rest));
  return cells;
};
const hasLine = (mask) => LINE_MASKS.some((line) => (mask & line) === line);
const completesLine = (mask, node) =>
  linesThrough[node].some((line) => ((mask | (1 << node)) & line) === line);
const winningCells = (mask, empties) => cellsOf(empties).filter((cell) => completesLine(mask, cell));

const applyPerm = (mask, perm) => {
  let result = 0;
  for (const cell of cellsOf(mask)) result |= 1 << perm[cell];
  return result;
};

// Smallest (red, blue) image under the 8 symmetries — the canonical key — plus
// the permutation that produced it, so a move can be mapped into that frame.
const canonicalize = (red, blue) => {
  let bestRed = Infinity;
  let bestBlue = Infinity;
  let bestPerm = SYMMETRIES[0];
  for (const perm of SYMMETRIES) {
    const r = applyPerm(red, perm);
    const b = applyPerm(blue, perm);
    if (r < bestRed || (r === bestRed && b < bestBlue)) {
      bestRed = r;
      bestBlue = b;
      bestPerm = perm;
    }
  }
  return { key: `${bestRed},${bestBlue}`, perm: bestPerm };
};

// --- Exact solver --------------------------------------------------------------
// Which player (1 or 2) wins with optimal play from this position? Forced-move
// pruning keeps the search tractable: an immediate win ends it, and facing two
// separate threats is already lost, so only a single threat leaves a real choice.
const memo = new Map();

const solve = (red, blue) => {
  const { key } = canonicalize(red, blue);
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  const empties = ~(red | blue) & FULL;
  if (empties === 0) { // full board with no line
    memo.set(key, 2);
    return 2;
  }

  const mover = cellsOf(red).length === cellsOf(blue).length ? 1 : 2;
  const loser = mover === 1 ? 2 : 1;
  const mine = mover === 1 ? red : blue;
  const theirs = mover === 1 ? blue : red;

  if (winningCells(mine, empties).length > 0) {
    memo.set(key, mover);
    return mover;
  }

  const threats = winningCells(theirs, empties);
  if (threats.length >= 2) { // cannot block both
    memo.set(key, loser);
    return loser;
  }
  const candidates = threats.length === 1 ? threats : cellsOf(empties);

  let result = loser;
  for (const cell of candidates) {
    const winner = mover === 1 ? solve(red | (1 << cell), blue) : solve(red, blue | (1 << cell));
    if (winner === mover) {
      result = mover;
      break;
    }
  }
  memo.set(key, result);
  return result;
};

// --- Build the first player's winning strategy ---------------------------------
// Recurse over the positions the bot can actually reach: at its own turn store
// one winning move, then branch over every opponent reply.
const buildStrategy = () => {
  const strategy = {};

  const visit = (red, blue) => {
    const { key, perm } = canonicalize(red, blue);
    if (strategy[key] !== undefined) return;

    const empties = ~(red | blue) & FULL;
    const immediate = winningCells(red, empties);
    const move = immediate.length > 0
      ? immediate[0]
      : cellsOf(empties).find((cell) => solve(red | (1 << cell), blue) === 1);
    if (move === undefined) throw new Error(`no winning move at ${key}, but the first player should win`);

    strategy[key] = perm[move]; // stored in the canonical frame
    if (immediate.length > 0) return; // that move ends the game

    const nextRed = red | (1 << move);
    for (const reply of cellsOf(~(nextRed | blue) & FULL)) visit(nextRed, blue | (1 << reply));
  };

  visit(0, 0);
  return strategy;
};

// --- Exhaustive verification ---------------------------------------------------
// Replay the table against every possible opponent line: the first player must
// always complete a line, and the opponent must never get one.
const verify = (strategy) => {
  let wins = 0;

  const play = (red, blue) => {
    const { key, perm } = canonicalize(red, blue);
    const stored = strategy[key];
    if (stored === undefined) throw new Error(`table is missing reachable position ${key}`);
    const inverse = [];
    perm.forEach((to, from) => { inverse[to] = from; });
    const move = inverse[stored];
    if ((red | blue) & (1 << move)) throw new Error(`table move ${move} lands on an occupied cell`);

    const nextRed = red | (1 << move);
    if (hasLine(nextRed)) {
      wins++;
      return;
    }

    const replies = cellsOf(~(nextRed | blue) & FULL);
    if (replies.length === 0) throw new Error('board filled without a first-player line');
    for (const reply of replies) {
      const nextBlue = blue | (1 << reply);
      if (hasLine(nextBlue)) throw new Error(`opponent completed a line at ${reply}`);
      play(nextRed, nextBlue);
    }
  };

  play(0, 0);
  return wins;
};

// --- Run -----------------------------------------------------------------------
const startedAt = Date.now();
console.log(`Board: ${CELL_COUNT} cells, ${LINE_INDICES.length} lines, ${SYMMETRIES.length} symmetries.`);

const winner = solve(0, 0);
console.log(`Solved in ${Date.now() - startedAt}ms (${memo.size} canonical positions). Winner: player ${winner}.`);
if (winner !== 1) throw new Error(`expected the first player to win, got player ${winner}`);

const strategy = buildStrategy();
const wins = verify(strategy);
console.log(`Verified: the first player wins all ${wins} possible opponent lines.`);

const outputPath = path.join(__dirname, '../../src/components/games/modified-mill/strategy.json');
fs.writeFileSync(outputPath, JSON.stringify(strategy));
console.log(`Wrote ${Object.keys(strategy).length} entries to ${outputPath}`);

// board-data.ts holds the same geometry; print it so the two can be kept in sync
// when the board itself changes.
console.log('\nIf the board changed, update board-data.ts with:');
console.log(`export const COORDS: [number, number][] = ${JSON.stringify(COORDS)};`);
console.log(`export const LINES: [number, number, number][] = ${JSON.stringify(LINE_INDICES)};`);
console.log(`export const SYMMETRIES: number[][] = ${JSON.stringify(SYMMETRIES)};`);
