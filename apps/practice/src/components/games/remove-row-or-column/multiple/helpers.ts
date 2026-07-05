import { range, random, sample } from 'lodash';
import type { Board, Grid } from '../helpers';

interface Dims { h: number; w: number }

// Classify a rectangle by the parities of its sides (the official solution's
// A / B / C types): A = both sides even, B = exactly one even, C = both odd.
const oddSideCount = ({ h, w }: Dims): number => (h % 2) + (w % 2);

// A position is losing for the player to move exactly when the number of B-type
// and C-type rectangles are both even (equivalently: the Sprague–Grundy XOR is
// 0). Half the starting boards are built to satisfy this so the second player
// wins, the other half so the first player wins — each role wins ~50% overall.
const isLosingForMover = (dims: Dims[]): boolean => {
  const b = dims.filter(d => oddSideCount(d) === 1).length;
  const c = dims.filter(d => oddSideCount(d) === 2).length;
  return b % 2 === 0 && c % 2 === 0;
};

// Lay the rectangles out left to right, all aligned to the top, separated by a
// single blank column. The blank column keeps neighbouring rectangles isolated
// (no two discs of different rectangles touch, even diagonally), so the flood
// fill in ../helpers recovers each as its own rectangle.
const layout = (dims: Dims[]): Grid => {
  const height = Math.max(...dims.map(d => d.h));
  const width = dims.reduce((sum, d) => sum + d.w, 0) + (dims.length - 1);
  const grid: Grid = range(height).map(() => range(width).map(() => false));
  let col = 0;
  for (const { h, w } of dims) {
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) grid[r][col + c] = true;
    }
    col += w + 1;
  }
  return grid;
};

const SIDES = [2, 3, 4];
const MAX_WIDTH = 11; // keep the board comfortably within a mobile screen

const randomDims = (): Dims[] =>
  range(sample([2, 3])!).map(() => ({ h: sample(SIDES)!, w: sample(SIDES)! }));

const totalWidth = (dims: Dims[]): number =>
  dims.reduce((sum, d) => sum + d.w, 0) + (dims.length - 1);

export const generateStartBoard = (): Board => {
  const targetLosing = random(0, 1) === 0;
  let dims = randomDims();
  for (let tries = 0; tries < 400; tries++) {
    const candidate = randomDims();
    if (totalWidth(candidate) <= MAX_WIDTH && isLosingForMover(candidate) === targetLosing) {
      dims = candidate;
      break;
    }
  }
  return { grid: layout(dims) };
};
