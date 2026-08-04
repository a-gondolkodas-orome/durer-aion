import { sample } from 'lodash';
import { EDGES } from '../geometry';
import {
  type Board, LINE,
  applyShade, applyCircle, freeEdges, freeTriangles, shadedCount,
  liveThreats, preThreatEdges, isWinningShade
} from '../helpers';
import { OPENING_EDGES, isLineTurnWon, marchEdges, winningPairHeatEdges } from './forced-win';
import { makeMoveEvaluator } from './search';
import type { BotStrategy } from '../../../strategy-game-factory';
import type { moves } from '../triangle-circle-game';

type Bot = BotStrategy<Board, keyof typeof moves>

// Smart bot.
//
// LINE side — provably winning (see forced-win.ts and the certificate in
// forced-win.spec.ts): open with one of the certified central pair-heats,
// answer the circle player's reply with a second winning pair-heat, then run
// the forced march. The plan covers every circle reply from the start position,
// so as the line player this bot always wins; where several moves win equally
// (symmetric openings, multiple march steps or pair-heats) it samples among
// them for variety.
//
// CIRCLE side — best-effort defence: the line player wins this board with
// perfect play, so no circle strategy is "optimal" in the winning sense. The
// bot never volunteers into a position that is already lost by the two-hot
// criterion (isLineTurnWon), covers threats, defuses pre-threat edges, and uses
// the bounded search to dodge deeper tactics — a human playing line only beats
// it by executing a genuine winning plan.

type SearchOpts = { depth: number; budget: number };

// Per-move limits for the bounded search used in fallback positions. Modest so
// a bot turn never blocks the UI thread for long.
const SEARCH: SearchOpts = { depth: 12, budget: 45_000 };

// Build a bot with a given search budget. Exposed so tests can dial the
// fallback search down; the shipped bot uses SEARCH.
export const makeSmartBotStrategy = (searchOpts: SearchOpts = SEARCH): Bot =>
  ({ board, ctx }) => {
    if (ctx.currentPlayer === LINE) {
      return { move: 'shadeEdge', args: [chooseLineMove(board, searchOpts)] };
    } else {
      return { move: 'placeCircle', args: [chooseCircleMove(board, searchOpts)] };
    }
  };

export const smartBotStrategy = makeSmartBotStrategy(SEARCH);

// Easy "test" bot: plays at random for whichever side it holds, except that it
// grabs an immediate (one-move) win when one exists. Good for getting a feel
// for the rules before a real game.
export const randomBotStrategy: Bot = ({ board, ctx }) => {
  if (ctx.currentPlayer === LINE) {
    return { move: 'shadeEdge', args: [randomLineMove(board)] };
  } else {
    return { move: 'placeCircle', args: [randomCircleMove(board)] };
  }
};

// --- Line player -----------------------------------------------------------

const isEmptyBoard = (board: Board): boolean =>
  board.edges.every(e => !e) && board.circles.every(c => !c);

const chooseLineMove = (board: Board, searchOpts: SearchOpts): number => {
  const candidates = freeEdges(board);

  // 1. Immediate win: complete an un-circled triangle right now.
  const winning = candidates.filter(e => isWinningShade(board, e));
  if (winning.length > 0) return sample(winning)!;

  // 2. Two hot triangles in one component: march (every step forces the circle
  //    player, the last one creates a double threat).
  const march = marchEdges(board);
  if (march.length > 0) return sample(march)!;

  // 3. From the start position, play one of the certified opening pair-heats
  //    (the certificate's edge or a symmetric image of it).
  if (isEmptyBoard(board)) return sample(OPENING_EDGES)!;

  // 4. A pair-heat all circle replies lose to (the certificate's second move).
  const pairHeats = winningPairHeatEdges(board);
  if (pairHeats.length > 0) return sample(pairHeats)!;

  // 5. Fallback for positions outside the plan (only reachable if the game
  //    didn't start from the certified line): bounded search plus heuristic.
  const ordered = candidates
    .map(e => ({ e, score: lineHeuristicScore(board, e) }))
    .sort((a, b) => b.score - a.score);

  const evaluator = makeMoveEvaluator(searchOpts);
  const undecided: number[] = [];
  for (const { e } of ordered) {
    const outcome = evaluator.evalAfterShade(board, e);
    if (outcome === 'lineWins') return e;
    if (outcome === 'lineLoses') continue;
    undecided.push(e);
  }
  return undecided.length > 0 ? undecided[0] : ordered[0].e;
};

// Higher = a more promising shading move for the fallback ordering.
const lineHeuristicScore = (board: Board, edgeId: number): number => {
  const next = applyShade(board, edgeId);
  return 100 * preThreatEdges(next).length + 10 * liveThreats(next).length + lineProgress(next);
};

// Sum of shaded edges across un-circled, not-yet-complete triangles: rewards
// concentrating shading where it can still turn into a threat.
const lineProgress = (board: Board): number =>
  freeTriangles(board).reduce((sum, t) => {
    const count = shadedCount(board, t);
    return sum + (count < 3 ? count : 0);
  }, 0);

// --- Circle player ---------------------------------------------------------

// Higher = a more urgent triangle to circle: primarily how many pre-threat edges
// it sits on, then how shaded it already is.
const circleHeuristicScore = (board: Board, triangleId: number, preThreatCover: Map<number, number>): number =>
  100 * (preThreatCover.get(triangleId) ?? 0) + shadedCount(board, triangleId);

const chooseCircleMove = (board: Board, searchOpts: SearchOpts): number => {
  // Replies that do not leave a position the line player wins outright by the
  // two-hot criterion. When any exist, never pick outside this set — this is
  // the topological "delete the right hot" defence that simple counting rules
  // miss (it is why they lose even the small boards the circle player wins).
  const safeSet = new Set(
    freeTriangles(board).filter(t => !isLineTurnWon(applyCircle(board, t)))
  );
  const preferSafe = (candidates: number[]): number[] => {
    const safe = candidates.filter(t => safeSet.has(t));
    return safe.length > 0 ? safe : candidates;
  };

  // 1. Cover a live threat (un-circled triangle with two shaded edges). If more
  //    than one exists the position is already lost, but cover one anyway.
  const threats = liveThreats(board);
  if (threats.length > 0) return sample(preferSafe(threats))!;

  // Pre-threat coverage per triangle, for ordering.
  const preThreatCover = new Map<number, number>();
  for (const e of preThreatEdges(board)) {
    for (const t of EDGES[e].triangleIds) preThreatCover.set(t, (preThreatCover.get(t) ?? 0) + 1);
  }

  const ordered = preferSafe(freeTriangles(board))
    .map(t => ({ t, score: circleHeuristicScore(board, t, preThreatCover) }))
    .sort((a, b) => b.score - a.score);

  // 2. Search the most promising fills first. Take a move that provably denies
  //    the line player a win in the horizon, skip any that hand one over.
  const evaluator = makeMoveEvaluator(searchOpts);
  const undecided: number[] = [];
  for (const { t } of ordered) {
    const outcome = evaluator.evalAfterCircle(board, t);
    if (outcome === 'lineLoses') return t;
    if (outcome === 'lineWins') continue;
    undecided.push(t);
  }
  return undecided.length > 0 ? undecided[0] : ordered[0].t;
};

// Random moves for the test bot / property tests. The line side still takes an
// immediate win (a triangle at two shaded sides) when one is on the board; the
// circle side's only one-move win is filling the last triangle, which a random
// pick makes anyway.
export const randomLineMove = (board: Board): number => {
  const winning = freeEdges(board).filter(e => isWinningShade(board, e));
  return sample(winning.length > 0 ? winning : freeEdges(board))!;
};
export const randomCircleMove = (board: Board): number => sample(freeTriangles(board))!;
