import { range, random, sample } from 'lodash';
import type { Board, Grid } from '../helpers';

const makeFullGrid = (rows: number, cols: number): Grid =>
  range(rows).map(() => range(cols).map(() => true));

// Half the starting boards have both sides even (2nd player wins), half have an
// odd side (1st player wins) — so each role wins ~50% across random starts.
export const generateStartBoard = (): Board => {
  let rows: number, cols: number;
  if (random(0, 1)) {
    rows = sample([2, 4, 6])!;
    cols = sample([2, 4, 6])!;
  } else {
    do {
      rows = sample([3, 4, 5, 6])!;
      cols = sample([3, 4, 5, 6])!;
    } while (rows % 2 === 0 && cols % 2 === 0);
  }
  return { grid: makeFullGrid(rows, cols) };
};
