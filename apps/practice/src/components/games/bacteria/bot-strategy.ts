import { cloneDeep, sample, maxBy } from "lodash";
import type { BotStrategy } from '../../strategy-game-factory';
import { computeLettered, computeSinks, deficiency } from "./danger";
import {
  type Board,
  type AttackMove,
  applyAttackMove,
  bacteriaCoords,
  totalBacteria,
  inBoard,
  isAttackAllowed,
  spreadChildren,
  isGoalCell,
  topRowIdx,
  ATTACKER,
  DEFENDER,
  type Moves
} from "./helpers";

type Bot = BotStrategy<Board, Moves>

export type { AttackMove };

// Pure look-ahead over the shared attacker-move mechanics (see applyAttackMove).
export const simulate = (board: Board, move: AttackMove): { board: Board; reachedGoal: boolean } => {
  const { nextBoard, reachedGoal } = applyAttackMove(board, move);
  return { board: nextBoard, reachedGoal };
};

const ATTACK_TYPES = ['shiftRight', 'shiftLeft', 'jump', 'spread'] as const;

// The bot enumerates its options with the very predicate the engine validates
// dispatches against, so the two can never disagree.
export const legalAttackMoves = (board: Board): AttackMove[] =>
  bacteriaCoords(board).flatMap(([row, col]) =>
    ATTACK_TYPES
      .map(type => ({ type, row, col }))
      .filter(move => isAttackAllowed(board, move))
  );

// A move is winning-preserving when, after every possible defender removal,
// the attacker is still winning (or has already reached a goal).
const keepsWinning = (
  board: Board,
  move: AttackMove,
  lettered: boolean[][],
  sinks: boolean[][]
): boolean => {
  const { board: afterAttack, reachedGoal } = simulate(board, move);
  if (reachedGoal) return true;
  for (const [row, col] of bacteriaCoords(afterAttack)) {
    const afterDefense = cloneDeep(afterAttack);
    afterDefense.bacteria[row][col] -= 1;
    if (totalBacteria(afterDefense) === 0) return false;
    if (deficiency(afterDefense, lettered, sinks) < 1) return false;
  }
  return true;
};

// Higher score = closer to a forced win: get a bacterium onto a lettered cell,
// otherwise climb as high as possible.
const progressScore = (board: Board, move: AttackMove, lettered: boolean[][]): number => {
  const { board: after } = simulate(board, move);
  let letteredCount = 0;
  let sumRows = 0;
  let maxRow = 0;
  for (const [r, c] of bacteriaCoords(after)) {
    const count = after.bacteria[r][c];
    if (lettered[r][c]) letteredCount += count;
    sumRows += r * count;
    maxRow = Math.max(maxRow, r);
  }
  return letteredCount * 100000 + maxRow * 1000 + sumRows;
};

export const attackerMove = (board: Board): AttackMove => {
  const lettered = computeLettered(board);
  const sinks = computeSinks(board, lettered);
  const top = topRowIdx(board);
  const coords = bacteriaCoords(board);

  // Phase A: a bacterium already sits on a lettered cell -> force the win.
  const letteredCoords = coords.filter(([r, c]) => lettered[r][c]);
  if (letteredCoords.length) {
    const [row, col] = maxBy(letteredCoords, ([r]) => r)!;
    // Immediate win if a goal is one move away.
    if (row === top && board.goals.includes(col - 1)) return { type: 'shiftLeft', row, col };
    if (row === top && board.goals.includes(col + 1)) return { type: 'shiftRight', row, col };
    if (inBoard(board, row + 2, col) && isGoalCell(board, row + 2, col)) {
      return { type: 'jump', row, col };
    }
    if (spreadChildren(board, row, col).length === 2) return { type: 'spread', row, col };
  }

  // Phase B: maneuver a bacterium up into the lettered region.
  const moves = legalAttackMoves(board);
  const winning = moves.filter(m => keepsWinning(board, m, lettered, sinks));
  const pool = winning.length ? winning : moves;
  return maxBy(pool, m => progressScore(board, m, lettered))!;
};

// The defender removes one bacterium. Optimal play keeps the position
// defender-winning (deficiency 0); if that is impossible the position is
// already lost, so play to punish attacker mistakes.
export const defenderMove = (board: Board): { row: number; col: number } => {
  const lettered = computeLettered(board);
  const sinks = computeSinks(board, lettered);
  const coords = bacteriaCoords(board);

  const safe = coords.filter(([row, col]) => {
    const after = cloneDeep(board);
    after.bacteria[row][col] -= 1;
    return deficiency(after, lettered, sinks) === 0;
  });
  if (safe.length) {
    const [row, col] = sample(safe)!;
    return { row, col };
  }

  // Losing: remove the most advanced threat (highest lettered, else highest row).
  const letteredCoords = coords.filter(([r, c]) => lettered[r][c]);
  const [row, col] = maxBy(letteredCoords.length ? letteredCoords : coords, ([r]) => r)!;
  return { row, col };
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  if (ctx.chosenRoleIndex === ATTACKER) {
    const { row, col } = defenderMove(board);
    return { move: 'defend', args: [{ row, col }] };
  } else {
    const move = attackerMove(board);
    return { move: move.type, args: [{ row: move.row, col: move.col }] };
  }
};

// Test bot: plays randomly, but takes an immediate winning move when offered.
export const randomBotStrategy: Bot = ({ board, ctx }) => {
  const coords = bacteriaCoords(board);

  if (ctx.currentPlayer === DEFENDER) {
    const [row, col] = sample(coords)!;
    return { move: 'defend', args: [{ row, col }] };
  }

  const options = legalAttackMoves(board);
  const winningNow = options.find(m => simulate(board, m).reachedGoal);
  const move = winningNow ?? sample(options)!;
  return { move: move.type, args: [{ row: move.row, col: move.col }] };
};
