// Offline optimality proof for the 15-pole smart bot. Run with:
//   node verify-optimality.mjs
//
// It reimplements the game and the bot's move selection (identical to
// solver.ts, in plain JS since that file is TypeScript), then replays EVERY
// reachable position: at each bot turn it plays the move solver.ts would pick,
// and at each opponent turn it branches over all legal replies. It asserts the
// bot is never the one left unable to move — i.e. the second player's strategy
// wins against every possible line of play. Takes a couple of minutes.

const N = 4;
const V = ((N + 1) * (N + 2)) / 2;
const vertices = [];
{ let id = 0; for (let x = 0; x <= N; x++) for (let p = 0; p <= x; p++)
  vertices.push({ id: id++, x, y: N - x + p, z: N - p }); }
const range = n => [...Array(n).keys()];
const idByCoord = {}; vertices.forEach(v => idByCoord[`${v.x},${v.y},${v.z}`] = v.id);

// symmetry group (D3) — only used to deduplicate positions during verification
const reflect = (a, b) => vertices.map(v => { const c = { x: v.x, y: v.y, z: v.z };
  [c[a], c[b]] = [c[b], c[a]]; return idByCoord[`${c.x},${c.y},${c.z}`]; });
const gens = [reflect('y', 'z'), reflect('x', 'z'), reflect('x', 'y')];
const compose = (a, b) => a.map((_, i) => a[b[i]]);
const group = [range(V)];
{ let ch = true; while (ch) { ch = false; for (const g of [...group]) for (const gn of gens) {
  const c = compose(g, gn); if (!group.some(h => h.every((x, i) => x === c[i]))) { group.push(c); ch = true; } } } }

const bit = i => 1 << i;
const linesArr = [];
for (const dir of ['x', 'y', 'z']) { const byC = {}; vertices.forEach(v => (byC[v[dir]] ||= []).push(v.id));
  Object.values(byC).forEach(ids => { if (ids.length >= 2) linesArr.push([...ids].sort((a, b) => a - b)); }); }
const orient = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
const ropes = []; const ropeIndex = {};
for (const line of linesArr) for (let i = 0; i < line.length; i++) for (let j = i + 1; j < line.length; j++) {
  let nodeMask = 0, midMask = 0;
  for (let k = i; k <= j; k++) { nodeMask |= bit(line[k]); if (k > i && k < j) midMask |= bit(line[k]); }
  ropeIndex[orient(line[i], line[j])] = ropes.length;
  ropes.push({ from: line[i], to: line[j], str: orient(line[i], line[j]), nodeMask, midMask, line, i, j });
}
const superIdx = ropes.map(r => { const res = [];
  for (let a = 0; a <= r.i; a++) for (let b = r.j; b < r.line.length; b++) {
    if (a === r.i && b === r.j) continue; res.push(ropeIndex[orient(r.line[a], r.line[b])]); }
  return res; });
const ropePerm = group.map(g => ropes.map(r => ropeIndex[orient(g[r.from], g[r.to])]));
const fromBit = ropes.map(r => bit(r.from));
const toBit = ropes.map(r => bit(r.to));
const R = ropes.length;

const occMask = board => board.reduce((m, ri) => m | ropes[ri].nodeMask, 0);
const isAllowedIdx = (board, occ, ri) => {
  if ((ropes[ri].midMask & occ) !== 0) return false;
  for (const e of board) { const nm = ropes[e].nodeMask; if ((nm & fromBit[ri]) && (nm & toBit[ri])) return false; }
  return true; };
const allowedCache = new Map();
const allowedMoves = board => {
  const k = board.join(','); const c = allowedCache.get(k); if (c) return c;
  const occ = occMask(board); const res = [];
  for (let ri = 0; ri < R; ri++) { if (!isAllowedIdx(board, occ, ri)) continue;
    if (superIdx[ri].some(s => isAllowedIdx(board, occ, s))) continue; res.push(ri); }
  allowedCache.set(k, res); return res; };
const corners = [0, (N * (N + 1)) / 2, V - 1];
const oneLenSet = new Set();
for (const line of linesArr) for (let i = 0; i + 1 < line.length; i++) oneLenSet.add(ropeIndex[orient(line[i], line[i + 1])]);
const trivialMoves = board => { const occ = occMask(board); const cov = i => (occ & bit(i)) !== 0;
  return allowedMoves(board).filter(ri => oneLenSet.has(ri)).filter(ri => { const r = ropes[ri];
    return (cov(r.from) && cov(r.to)) || (corners.includes(r.from) && cov(r.to)) || (cov(r.from) && corners.includes(r.to)); }); };
const insert = (b, ri) => { const c = b.slice(); c.push(ri); c.sort((x, y) => x - y); return c; };
const insertAll = (b, ris) => { const c = b.concat(ris); c.sort((x, y) => x - y); return c; };

const memo = new Map();
const isPreviousPlayerWinning = board => {
  const key = board.join(','); const hit = memo.get(key); if (hit !== undefined) return hit;
  let res; const allowed = allowedMoves(board);
  if (allowed.length === 0) res = true;
  else { const trivial = trivialMoves(board); const tset = new Set(trivial);
    const nonTrivial = allowed.filter(ri => !tset.has(ri));
    if (nonTrivial.length === 0) res = trivial.length % 2 === 0;
    else if (trivial.length % 2 === 0) { const sim = insertAll(board, trivial);
      res = !nonTrivial.some(ri => isPreviousPlayerWinning(insert(sim, ri))); }
    else { const sim = insertAll(board, trivial.slice(1));
      res = ![...nonTrivial, trivial[0]].some(ri => isPreviousPlayerWinning(insert(sim, ri))); } }
  memo.set(key, res); return res; };
const findWinningMove = board => {
  const moves = allowedMoves(board).slice().sort((a, b) => ropes[a].str < ropes[b].str ? -1 : 1);
  for (const ri of moves) if (isPreviousPlayerWinning(insert(board, ri))) return ri;
  return -1; };

const canonKey = board => { let best = null;
  for (const pm of ropePerm) { const k = board.map(ri => ropes[pm[ri]].str).sort().join(','); if (best === null || k < best) best = k; }
  return best; };

console.log(`isPreviousPlayerWinning([]) = ${isPreviousPlayerWinning([])} (true => 2nd player wins the empty board)`);

const t0 = Date.now(); let maxLen = 0; const seen = new Set();
const verify = board => {                 // board: bot (2nd player) to move
  const vk = canonKey(board); if (seen.has(vk)) return; seen.add(vk);
  const ri = findWinningMove(board);
  if (ri < 0) throw new Error(`bot has no winning move at ${board.map(r => ropes[r].str)}`);
  const afterBot = insert(board, ri);
  const replies = allowedMoves(afterBot);
  if (replies.length === 0) { maxLen = Math.max(maxLen, afterBot.length); return; }
  for (const opp of replies) verify(insert(afterBot, opp));
};
for (const opening of allowedMoves([])) verify([opening]);
console.log(`VERIFIED: the second player wins from every reachable position ` +
  `(${seen.size} distinct positions checked, ${Date.now() - t0}ms)`);
