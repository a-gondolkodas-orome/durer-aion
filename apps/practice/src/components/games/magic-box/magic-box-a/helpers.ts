export type Board = boolean[]

/*
board indices topography
[0, 1, 2,
 3, 4, 5,
 6, 7, 8]
*/

export const generateEmptyBoard = (): Board => Array(9).fill(false);

export const placeStone = (board: Board, i: number): Board => [...board.slice(0, i), true, ...board.slice(i + 1)];

// A stone goes into any compartment that is still empty.
export const isPlacementAllowed = (board: Board, id: number): boolean =>
  Number.isInteger(id) && id >= 0 && id < board.length && !board[id];

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8]
];

export const hasFullLine = (board: Board) => LINES.some(line => line.every(i => board[i]));

export const isGameEnd = hasFullLine;
