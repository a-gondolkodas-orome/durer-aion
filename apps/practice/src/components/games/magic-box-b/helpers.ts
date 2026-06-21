import type { I18nString } from '../../language';

export type Board = { stones: boolean[]; pendingLine: number | null }

/*
board indices topography
[0, 1, 2,
 3, 4, 5,
 6, 7, 8]
*/

export const generateEmptyBoard = (): Board => ({ stones: Array(9).fill(false), pendingLine: null });

export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8]
];

export const LINE_LABELS: I18nString[] = [
  { hu: '1. sor', en: 'Row 1' },
  { hu: '2. sor', en: 'Row 2' },
  { hu: '3. sor', en: 'Row 3' },
  { hu: '1. oszlop', en: 'Column 1' },
  { hu: '2. oszlop', en: 'Column 2' },
  { hu: '3. oszlop', en: 'Column 3' }
];

export const isLineFull = (stones: boolean[], lineIndex: number) => LINES[lineIndex].every(i => stones[i]);

export const emptyCellsInLine = (stones: boolean[], lineIndex: number) => LINES[lineIndex].filter(i => !stones[i]);

export const placeStoneAt = (stones: boolean[], cellId: number): boolean[] =>
  [...stones.slice(0, cellId), true, ...stones.slice(cellId + 1)];
