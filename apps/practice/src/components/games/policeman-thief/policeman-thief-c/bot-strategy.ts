import { sample, random, range } from 'lodash';
import { THIEF, VERTEX_COUNT, dist, minDistToSet, neighbours, type Board, type Moves } from './gameplay';
import type { BotMove, BotStrategy } from 'strategy-game-factory';

type Bot = BotStrategy<Board, Moves>

// --- Minimax core -----------------------------------------------------------
// Exhaustive; the graph and rules are fixed so the memo below is valid for the
// whole session. A "round" is: all policemen move, then the thief moves. The
// thief wins by completing 3 moves without ever sharing a vertex with a
// policeman.

const sortedKey = (cops: number[]) => [...cops].sort((a, b) => a - b).join(',');

// All ordered per-cop move assignments (each cop steps to one of its neighbours).
const copAssignments = (cops: number[]): number[][] => {
  let acc: number[][] = [[]];
  for (const c of cops) {
    const next: number[][] = [];
    for (const partial of acc) for (const nb of neighbours[c]) next.push([...partial, nb]);
    acc = next;
  }
  return acc;
};

// Deduped resulting cop multisets (sorted) after a joint move — used by minimax.
const jointMoveCache = new Map<string, number[][]>();
const copResultMoves = (cops: number[]): number[][] => {
  const ck = sortedKey(cops);
  const cached = jointMoveCache.get(ck);
  if (cached) return cached;
  const seen = new Set<string>();
  const out: number[][] = [];
  for (const assignment of copAssignments(cops)) {
    const s = [...assignment].sort((a, b) => a - b);
    const k = s.join(',');
    if (!seen.has(k)) { seen.add(k); out.push(s); }
  }
  jointMoveCache.set(ck, out);
  return out;
};

const survMemo = new Map<string, boolean>();
// Can the thief survive, given it is the start of a round (police to move), the
// thief is currently safe, and it still has `movesLeft` moves to complete?
export const thiefSurvives = (cops: number[], thief: number, movesLeft: number): boolean => {
  if (movesLeft === 0) return true;
  const key = sortedKey(cops) + '|' + thief + '|' + movesLeft;
  const cached = survMemo.get(key);
  if (cached !== undefined) return cached;
  let result = true;
  for (const nc of copResultMoves(cops)) {
    if (nc.includes(thief)) { result = false; break; } // a policeman steps onto the thief
    const thiefCanReply = neighbours[thief].some(
      (t) => !nc.includes(t) && thiefSurvives(nc, t, movesLeft - 1)
    );
    if (!thiefCanReply) { result = false; break; } // police found a move the thief can't answer
  }
  survMemo.set(key, result);
  return result;
};

// Does this concrete police joint move (as a multiset) force the thief to lose?
export const copMoveWins = (newcops: number[], thief: number, movesLeft: number): boolean => {
  if (newcops.includes(thief)) return true;
  const thiefCanReply = neighbours[thief].some(
    (t) => !newcops.includes(t) && thiefSurvives(newcops, t, movesLeft - 1)
  );
  return !thiefCanReply;
};

// All cop placements (multisets of the given size) that win against every thief start.
const placementCache = new Map<number, number[][]>();
export const winningPlacements = (copCount: number): number[][] => {
  const cached = placementCache.get(copCount);
  if (cached) return cached;
  const result: number[][] = [];
  const build = (start: number, cur: number[]) => {
    if (cur.length === copCount) {
      for (let t = 0; t < VERTEX_COUNT; t++) {
        if (cur.includes(t)) continue;
        if (thiefSurvives(cur, t, 3)) return; // thief escapes -> placement isn't winning
      }
      result.push(cur.slice());
      return;
    }
    for (let v = start; v < VERTEX_COUNT; v++) { cur.push(v); build(v, cur); cur.pop(); }
  };
  build(0, []);
  placementCache.set(copCount, result);
  return result;
};

// tie-aware argmin/argmax helpers (return every element reaching the extreme)
const argExtreme = <T,>(arr: T[], keyFn: (x: T) => number, wantMax: boolean): T[] => {
  let best = wantMax ? -Infinity : Infinity;
  let ties: T[] = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (k === best) ties.push(x);
    else if (wantMax ? k > best : k < best) { best = k; ties = [x]; }
  }
  return ties;
};

const totalCentrality = (v: number) => range(VERTEX_COUNT).reduce((s, u) => s + dist[v][u], 0);

// --- Smart (optimal) bot ----------------------------------------------------

const chooseCopPlacement = (copCount: number): number[] => {
  const winning = winningPlacements(copCount);
  if (winning.length) return sample(winning)!.slice();
  // No forced win (e.g. a lone policeman): occupy the most central vertices.
  return range(VERTEX_COUNT).sort((a, b) => totalCentrality(a) - totalCentrality(b)).slice(0, copCount);
};

// Every policeman is placed (or stepped) in the same turn, from a plan made for
// the position the turn starts in, so a turn is named as a whole. A step onto
// the thief ends the game there and then, leaving the rest of the plan moot.
const asCopMoves = (move: 'placeCop' | 'moveCop', target: number[]): BotMove<Moves>[] =>
  target.map(vertex => move === 'placeCop'
    ? { move: 'placeCop', args: [vertex] }
    : { move: 'moveCop', args: [vertex] });

const placeCopsOptimally = (board: Board): BotMove<Moves>[] =>
  asCopMoves('placeCop', chooseCopPlacement(board.copCount));

const placeThiefOptimally = (board: Board): BotMove<Moves> => {
  const cops = board.policemen;
  const candidates = range(VERTEX_COUNT).filter((v) => !cops.includes(v));
  const surviving = candidates.filter((v) => thiefSurvives(cops, v, 3));
  const pool = surviving.length ? surviving : candidates;
  // Safest start: farthest from the nearest policeman (delays capture when doomed).
  const best = argExtreme(pool, (v) => minDistToSet(v, cops), true);
  return { move: 'placeThief', args: [sample(best)!] };
};

export const chooseCopMove = (cops: number[], thief: number, movesLeft: number): number[] => {
  const assignments = copAssignments(cops);
  const totalDistToThief = (a: number[]) => a.reduce((s, p) => s + dist[p][thief], 0);
  const winning = assignments.filter((a) => copMoveWins(a, thief, movesLeft));
  const pool = winning.length ? winning : assignments;
  // Among equally good moves, close in on the thief for natural-looking play.
  return sample(argExtreme(pool, totalDistToThief, false))!;
};

const moveCopsOptimally = (board: Board): BotMove<Moves>[] =>
  asCopMoves('moveCop', chooseCopMove(board.policemen, board.thief!, 3 - board.thiefMoveCount));

const moveThiefOptimally = (board: Board): BotMove<Moves> => {
  const { policemen: cops, thief } = board;
  const movesLeft = 3 - board.thiefMoveCount;
  const safe = neighbours[thief!].filter((t) => !cops.includes(t));
  const surviving = safe.filter((t) => thiefSurvives(cops, t, movesLeft - 1));
  const pool = surviving.length ? surviving : (safe.length ? safe : neighbours[thief!]);
  // Evade toward the vertex farthest from the nearest policeman.
  const best = argExtreme(pool, (t) => minDistToSet(t, cops), true);
  return { move: 'moveThief', args: [sample(best)!] };
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  if (ctx.chosenRoleIndex === THIEF) {
    return board.phase === 'placingCops' ? placeCopsOptimally(board) : moveCopsOptimally(board);
  }
  return board.phase === 'placingThief' ? placeThiefOptimally(board) : moveThiefOptimally(board);
};

// --- Random test bot --------------------------------------------------------
// Plays random legal moves, but always grabs an immediate catch (police) or a
// safe step (thief) when one is available, so a human thief can realistically
// win, unlike against the optimal bot.

const placeCopsRandom = (board: Board): BotMove<Moves>[] =>
  asCopMoves('placeCop', range(board.copCount).map(() => random(0, VERTEX_COUNT - 1)));

const moveCopsRandom = (board: Board): BotMove<Moves>[] => {
  const thief = board.thief!;
  return asCopMoves('moveCop', board.policemen.map((c) => {
    const nbs = neighbours[c];
    return nbs.includes(thief) ? thief : sample(nbs)!; // grab a catch if adjacent
  }));
};

const placeThiefRandom = (board: Board): BotMove<Moves> => {
  const candidates = range(VERTEX_COUNT).filter((v) => !board.policemen.includes(v));
  return { move: 'placeThief', args: [sample(candidates)!] };
};

const moveThiefRandom = (board: Board): BotMove<Moves> => {
  const safe = neighbours[board.thief!].filter((t) => !board.policemen.includes(t));
  return { move: 'moveThief', args: [sample(safe.length ? safe : neighbours[board.thief!])!] };
};

export const randomBotStrategy: Bot = ({ board, ctx }) => {
  if (ctx.chosenRoleIndex === THIEF) {
    return board.phase === 'placingCops' ? placeCopsRandom(board) : moveCopsRandom(board);
  }
  return board.phase === 'placingThief' ? placeThiefRandom(board) : moveThiefRandom(board);
};
