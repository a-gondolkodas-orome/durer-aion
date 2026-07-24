import { sample, maxBy } from 'lodash';
import type { StrategyArgs } from '../../strategy-game-factory';
import { SYMMETRIES } from './board-data';
import {
  type Board, CELL_COUNT, boardMasks, emptyCells, completesLine, linesThrough
} from './helpers';
import strategyTable from './strategy.json';

const STRATEGY: Record<string, number> = strategyTable;

// --- Board symmetry / canonical form ------------------------------------------
// The precomputed table is keyed by the canonical form of a position under the
// board's 8 dihedral symmetries. To look a position up we map it to that form,
// read the stored move (in the canonical frame) and map it back. This mirrors
// exactly the offline solver that generated strategy.json.
const applyPerm = (mask: number, perm: number[]): number => {
  let result = 0;
  for (let i = 0; i < CELL_COUNT; i++) {
    if (mask & (1 << i)) result |= 1 << perm[i];
  }
  return result;
};

// Returns the canonical key and the permutation mapping the actual board onto it.
export const canonicalize = (red: number, blue: number): { key: string; perm: number[] } => {
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

const invertPerm = (perm: number[]): number[] => {
  const inverse = new Array(CELL_COUNT);
  for (let i = 0; i < CELL_COUNT; i++) inverse[perm[i]] = i;
  return inverse;
};

// --- Move selection -----------------------------------------------------------
// First player wins with optimal play, so their move comes from the exhaustively
// verified strategy table: it always completes a line before the opponent can.
export const firstPlayerMove = (red: number, blue: number): number => {
  const { key, perm } = canonicalize(red, blue);
  const canonicalMove = STRATEGY[key];
  // Every position reachable while following the table is covered; the fallback
  // only guards against an unexpected off-table state.
  if (canonicalMove === undefined) return heuristicMove(red, blue);
  return invertPerm(perm)[canonicalMove];
};

// Second player cannot force a win from the empty board, so there is no perfect
// strategy — play the best-effort move that most pressures a fallible opponent:
// take an immediate win, block an immediate threat, otherwise build toward your
// own line while contesting theirs.
export const heuristicMove = (myMask: number, oppMask: number): number => {
  const empties = emptyCells(myMask, oppMask);

  const winning = empties.find((node) => completesLine(myMask, node));
  if (winning !== undefined) return winning;

  const threats = empties.filter((node) => completesLine(oppMask, node));
  if (threats.length > 0) return sample(threats)!;

  const score = (node: number): number =>
    linesThrough[node].reduce((total, line) => {
      const mine = countBits(myMask & line);
      const theirs = countBits(oppMask & line);
      if (theirs === 0) return total + (mine === 1 ? 5 : 1); // extend an open line
      if (mine === 0 && theirs === 1) return total + 1; // sit on their open line
      return total;
    }, 0);

  const best = maxBy(empties, score)!;
  const bestScore = score(best);
  return sample(empties.filter((node) => score(node) === bestScore))!;
};

const countBits = (mask: number): number => {
  let count = 0;
  while (mask) {
    mask &= mask - 1;
    count++;
  }
  return count;
};

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const { red, blue } = boardMasks(board);
  const node = ctx.currentPlayer === 0
    ? firstPlayerMove(red, blue)
    : heuristicMove(blue, red);
  moves.placePiece(board, node);
};

// Test bot: plays a random empty cell, but grabs an immediate line-completing
// win when one is available.
export const randomBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const { red, blue } = boardMasks(board);
  const myMask = ctx.currentPlayer === 0 ? red : blue;
  const empties = emptyCells(red, blue);
  const wins = empties.filter((node) => completesLine(myMask, node));
  const node = wins.length > 0 ? sample(wins)! : sample(empties)!;
  moves.placePiece(board, node);
};
