import { range, sample } from "lodash";
import type { Board } from "./helpers";

// Curated start boards for the bacteria game. This is the single source of
// truth: bacteria.tsx samples these for the actual variants, and
// bot-strategy.spec.ts iterates the same boards to prove they stay ~50/50
// balanced and bot-optimal. Keep it that way — don't copy the data into tests.

const rowCount = 9;

const emptyBacteria = (boardWidth: number): number[][] =>
  range(rowCount).map(rowIndex => Array(rowIndex % 2 === 0 ? boardWidth : boardWidth - 1).fill(0));

const buildBoard = (width: number, row: number, starts: number[], goals: number[]): Board => {
  const bacteria = emptyBacteria(width);
  starts.forEach(col => { bacteria[row][col] = 1; });
  return { bacteria, goals };
};

// "Adjacent goals" sub-game: goals form a contiguous block in the top row.
// Bacteria are seeded on rows 0-2 (width-11 board).
const adjacentStartConfigs: { row: number, starts: number[], goals: number[] }[] = [
  { row: 2, starts: [2, 4, 6, 8], goals: [3, 4, 5, 6, 7] },
  { row: 2, starts: [3, 5, 7], goals: [3, 4, 5, 6, 7] },
  { row: 1, starts: [1, 2, 3, 4], goals: [0, 1, 2, 3, 4, 5] },
  { row: 2, starts: [0, 1, 3], goals: [0, 1, 2, 3, 4, 5] },
  { row: 0, starts: [2, 3, 7, 9], goals: range(0, 11) },
  { row: 0, starts: [1, 2, 4, 8], goals: range(0, 11) },
  { row: 1, starts: [5, 6, 7, 8], goals: [5, 6, 7, 8, 9, 10] },
  { row: 2, starts: [7, 9, 10], goals: [5, 6, 7, 8, 9, 10] }
];

// "Scattered goals" sub-game: goals (top row) are not necessarily adjacent.
// Bacteria are seeded on the bottom row (width-17 board). Curated positions
// keep each side winning roughly half the time.
const scatteredStartConfigs: { starts: number[], goals: number[] }[] = [
  // attacker-winning
  { starts: [0, 1, 5, 8, 15], goals: [2, 5, 7, 8] },
  { starts: [1, 3, 4, 8, 11, 14], goals: [0, 5, 8, 12, 14] },
  { starts: [3, 7, 9, 12], goals: [4, 5, 9, 10, 11, 13] },
  { starts: [2, 5, 6, 14, 16], goals: [1, 5, 7, 8, 11] },
  { starts: [2, 5, 6, 8, 12, 16], goals: [3, 8, 9, 10, 13, 16] },
  // defender-winning
  { starts: [2, 5, 12, 16], goals: [4, 6, 7, 11, 12] },
  { starts: [3, 5, 9, 12], goals: [2, 3, 5, 13, 16] },
  { starts: [1, 8, 9, 10], goals: [3, 9, 13, 16] },
  { starts: [0, 4, 5, 11, 12, 13], goals: [4, 7, 10, 12] },
  { starts: [1, 3, 4, 11, 12, 15], goals: [1, 4, 5, 10, 12, 16] }
];

// Every curated board, deterministically — for tests that must cover them all.
export const adjacentStartBoards = (): Board[] =>
  adjacentStartConfigs.map(({ row, starts, goals }) => buildBoard(11, row, starts, goals));

export const scatteredStartBoards = (): Board[] =>
  scatteredStartConfigs.map(({ starts, goals }) => buildBoard(17, 0, starts, goals));

// A random curated board — for the actual game variants.
export const generateAdjacentStartBoard = (): Board => sample(adjacentStartBoards())!;

export const generateScatteredStartBoard = (): Board => sample(scatteredStartBoards())!;

// Test variant covers both sub-games.
export const generateTestStartBoard = (): Board =>
  sample([generateAdjacentStartBoard, generateScatteredStartBoard])!();
