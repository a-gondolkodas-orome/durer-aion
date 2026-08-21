'use strict';

/*
  The shark AI in shark-chase 5x5 decides its move with an exact game-tree search
  (see canSharkSurviveSharkTurn/canSharkSurviveSubmarineTurn in bot-strategy.ts),
  which guarantees it never throws away a winnable game. That search is fast once
  few turns remain, but slow (multiple seconds) for the first several turns, since
  the reachable state space is still large.

  In the vast majority of early-game states, the much cheaper greedy heuristic
  (selectByLocationPreference, based on safe-region size) already picks a winning
  move on its own. So instead of running the exact search on turns 1..MAX_TURN,
  we only need a small table of the EXCEPTIONS: states (up to a fixed turn) where
  the greedy heuristic would pick a losing move despite a win being available.

  IMPORTANT: states are enumerated via explicit forward BFS over every reachable
  submarine/shark combination up to PRECOMPUTE_MAX_TURN, NOT by relying on whatever
  states a single short-circuited minimax query from the start happens to visit.
  A short-circuited solve (which stops as soon as it finds one good-enough move) is
  correct for computing a state's OWN value, but it skips visiting many legally
  reachable sibling states entirely - so collecting exceptions only from memo.keys()
  after one root query silently misses real exceptions. (This was a real bug in an
  earlier version of this script, caught by an independent exhaustive verification.)

  This script writes the resulting table (key -> recommended move) directly to
  shark-5-by-5/shark-exception-moves.json, which bot-strategy.ts imports.
*/

const fs = require('fs');
const path = require('path');

const N = 25;
const W = 5;
const MAX_TURN = 15;
const PRECOMPUTE_MAX_TURN = 8;

const distanceFromShark = (shark, id) =>
  Math.abs((shark % W) - (id % W)) + Math.abs(Math.floor(shark / W) - Math.floor(id / W));

const isReachableWithoutDeath = (submarines, shark, id) => {
  if (distanceFromShark(shark, id) > 2) return false;
  if (submarines[id] >= 1) return false;
  if (distanceFromShark(shark, id) === 2) {
    if (id === shark - 2 && submarines[shark - 1] >= 1) return false;
    if (id === shark + 2 && submarines[shark + 1] >= 1) return false;
    if (id === shark + 10 && submarines[shark + 5] >= 1) return false;
    if (id === shark - 10 && submarines[shark - 5] >= 1) return false;
    if (id === shark - 6 && submarines[shark - 5] >= 1 && submarines[shark - 1] >= 1) return false;
    if (id === shark + 4 && submarines[shark + 5] >= 1 && submarines[shark - 1] >= 1) return false;
    if (id === shark + 6 && submarines[shark + 5] >= 1 && submarines[shark + 1] >= 1) return false;
    if (id === shark - 4 && submarines[shark - 5] >= 1 && submarines[shark + 1] >= 1) return false;
  }
  return true;
};

const adjacent = (pos) => {
  const cells = [];
  if (pos + W < N) cells.push(pos + W);
  if (pos - W >= 0) cells.push(pos - W);
  if (pos + 1 < N && pos % W !== W - 1) cells.push(pos + 1);
  if (pos - 1 >= 0 && pos % W !== 0) cells.push(pos - 1);
  return cells;
};

const isGameEnd = (submarines, shark, turn) => submarines[shark] >= 1 || turn > MAX_TURN;
const getWinnerIndex = (submarines, shark) => (submarines[shark] >= 1 ? 0 : 1);

const SHARK_WIN = 1, SUB_WIN = 0;
const memo = new Map();
const key = (submarines, shark, turn, phase) => submarines.join(',') + '|' + shark + '|' + turn + '|' + phase;

// These may short-circuit internally (stop as soon as one branch decides the
// outcome) - that's fine for VALUE correctness. Exhaustive *coverage* of which
// states get checked for heuristic exceptions is handled separately below, by
// explicit forward enumeration, not by relying on what these recursions visit.
function valueSubToMove(submarines, shark, turn) {
  const k = key(submarines, shark, turn, 'S');
  if (memo.has(k)) return memo.get(k);
  let anySubWin = false;
  outer: for (let from = 0; from < N; from++) {
    if (submarines[from] === 0) continue;
    for (const to of adjacent(from)) {
      const nextSub = submarines.slice();
      nextSub[from] -= 1; nextSub[to] += 1;
      const v = isGameEnd(nextSub, shark, turn)
        ? (getWinnerIndex(nextSub, shark) === 0 ? SUB_WIN : SHARK_WIN)
        : valueSharkToMove(nextSub, shark, turn);
      if (v === SUB_WIN) { anySubWin = true; break outer; }
    }
  }
  const result = anySubWin ? SUB_WIN : SHARK_WIN;
  memo.set(k, result);
  return result;
}

function valueSharkToMove(submarines, shark, turn) {
  const k = key(submarines, shark, turn, 'K');
  if (memo.has(k)) return memo.get(k);
  let anySharkWin = false;
  for (let to = 0; to < N; to++) {
    if (!isReachableWithoutDeath(submarines, shark, to)) continue;
    const nextTurn = turn + 1;
    const v = nextTurn > MAX_TURN ? SHARK_WIN : valueSubToMove(submarines, to, nextTurn);
    if (v === SHARK_WIN) { anySharkWin = true; break; }
  }
  const result = anySharkWin ? SHARK_WIN : SUB_WIN;
  memo.set(k, result);
  return result;
}

// Exact port of getComponentSizes from shark-5-by-5/bot-strategy.ts.
const getComponentSizes = (submarines) => {
  const isNextToSubmarine = (id) => {
    if (id + 5 < 25 && submarines[id + 5] >= 1) return true;
    if (id - 5 >= 0 && submarines[id - 5] >= 1) return true;
    if (id + 1 < 25 && id % 5 !== 4 && submarines[id + 1] >= 1) return true;
    if (id - 1 >= 0 && id % 5 !== 0 && submarines[id - 1] >= 1) return true;
    if (submarines[id] >= 1) return true;
    return false;
  };
  const visited = Array(25).fill(false);
  const visited2 = Array(25).fill(false);
  const componentSizes = Array(25).fill(0);
  const queue = [];
  let first;
  for (let i = 0; i < 25; i++) {
    if (!visited[i] && !isNextToSubmarine(i)) {
      queue.push(i); visited[i] = true;
      let counter = 0;
      while (queue.length > 0) {
        counter++;
        first = queue.shift();
        if (first + 5 < 25 && !isNextToSubmarine(first + 5) && !visited[first + 5]) { queue.push(first + 5); visited[first + 5] = true; }
        if (first - 5 >= 0 && !isNextToSubmarine(first - 5) && !visited[first - 5]) { queue.push(first - 5); visited[first - 5] = true; }
        if (first + 1 < 25 && first % 5 !== 4 && !isNextToSubmarine(first + 1) && !visited[first + 1]) { queue.push(first + 1); visited[first + 1] = true; }
        if (first - 1 >= 0 && first % 5 !== 0 && !isNextToSubmarine(first - 1) && !visited[first - 1]) { queue.push(first - 1); visited[first - 1] = true; }
      }
      queue.push(i); visited2[i] = true;
      while (queue.length > 0) {
        first = queue.shift();
        componentSizes[first] = counter;
        if (first + 5 < 25 && !isNextToSubmarine(first + 5) && !visited2[first + 5]) { queue.push(first + 5); visited2[first + 5] = true; }
        if (first - 5 >= 0 && !isNextToSubmarine(first - 5) && !visited2[first - 5]) { queue.push(first - 5); visited2[first - 5] = true; }
        if (first + 1 < 25 && first % 5 !== 4 && !isNextToSubmarine(first + 1) && !visited2[first + 1]) { queue.push(first + 1); visited2[first + 1] = true; }
        if (first - 1 >= 0 && first % 5 !== 0 && !isNextToSubmarine(first - 1) && !visited2[first - 1]) { queue.push(first - 1); visited2[first - 1] = true; }
      }
    }
  }
  return componentSizes;
};

// Exact port of selectByLocationPreference from shark-5-by-5/bot-strategy.ts.
const selectByLocationPreference = (submarines, pool) => {
  const componentSizes = getComponentSizes(submarines);
  let maxi = 1;
  for (const i of pool) if (maxi < componentSizes[i]) maxi = componentSizes[i];
  const groups = [[12], [7, 11, 13, 17], [6, 8, 16, 18], [2, 10, 14, 22], [1, 3, 5, 9, 15, 19, 21, 23], [0, 4, 20, 24]];
  let possibleMoves = [];
  for (const group of groups) {
    possibleMoves = pool.filter(i => group.includes(i) && componentSizes[i] === maxi);
    if (possibleMoves.length > 0) break;
  }
  return possibleMoves.length > 0 ? possibleMoves : pool;
};

const startSubmarines = [
  0, 0, 0, 1, 1,
  0, 0, 0, 1, 1,
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0
];

console.log(`Enumerating every state reachable by turn <= ${PRECOMPUTE_MAX_TURN}...`);
const t0 = Date.now();

const exceptionKey = (submarines, shark, turn) => `${submarines.join(',')}|${shark}|${turn}`;
const exceptions = {};
let checked = 0;
let visitedStates = 0;

const seen = new Set();
// Turn 1's K-state (the point where the shark decides) requires turn 1's submarine
// move to ALREADY be applied - seed the queue with those post-move states, not the
// raw, unmoved starting config (which would shift every turn label by one).
const queue = [];
for (let from = 0; from < N; from++) {
  if (startSubmarines[from] === 0) continue;
  for (const adj of adjacent(from)) {
    const nextSub = startSubmarines.slice();
    nextSub[from] -= 1;
    nextSub[adj] += 1;
    queue.push({ submarines: nextSub, shark: 20, turn: 1 });
  }
}

while (queue.length > 0) {
  const { submarines, shark, turn } = queue.pop();
  if (submarines[shark] >= 1 || turn > PRECOMPUTE_MAX_TURN) continue;
  const k = key(submarines, shark, turn, 'K');
  if (seen.has(k)) continue;
  seen.add(k);
  visitedStates++;

  const trueValue = valueSharkToMove(submarines, shark, turn);
  if (trueValue === SHARK_WIN) {
    checked++;
    const reachable = [];
    for (let i = 0; i < N; i++) if (isReachableWithoutDeath(submarines, shark, i)) reachable.push(i);

    const isWinning = (to) => {
      const nextTurn = turn + 1;
      return nextTurn > MAX_TURN ? true : valueSubToMove(submarines, to, nextTurn) === SHARK_WIN;
    };

    const heuristicCandidates = selectByLocationPreference(submarines, reachable);
    if (!heuristicCandidates.every(isWinning)) {
      const winningMoves = reachable.filter(isWinning);
      const recommended = selectByLocationPreference(submarines, winningMoves)[0];
      exceptions[exceptionKey(submarines, shark, turn)] = recommended;
    }
  }

  // Expand via every legal shark move (not just the heuristic's pick) and every legal
  // submarine move, to reach literally every state up to PRECOMPUTE_MAX_TURN.
  for (let to = 0; to < N; to++) {
    if (!isReachableWithoutDeath(submarines, shark, to)) continue;
    const nextTurn = turn + 1;
    if (nextTurn > PRECOMPUTE_MAX_TURN) continue;
    for (let from = 0; from < N; from++) {
      if (submarines[from] === 0) continue;
      for (const adj of adjacent(from)) {
        const nextSub = submarines.slice();
        nextSub[from] -= 1;
        nextSub[adj] += 1;
        queue.push({ submarines: nextSub, shark: to, turn: nextTurn });
      }
    }
  }
}

console.log(`Done in ${Date.now() - t0}ms. Visited ${visitedStates} states, ${checked} were SHARK_WIN, exceptions: ${Object.keys(exceptions).length}`);

const outputPath = path.join(__dirname, '../../../src/components/games/shark-chase/shark-5-by-5/shark-exception-moves.json');
fs.writeFileSync(outputPath, JSON.stringify(exceptions));
console.log(`Wrote ${Object.keys(exceptions).length} entries to ${outputPath}`);
console.log(`(PRECOMPUTE_MAX_TURN in bot-strategy.ts must match: ${PRECOMPUTE_MAX_TURN})`);
