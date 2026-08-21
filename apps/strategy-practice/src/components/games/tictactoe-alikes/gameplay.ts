import { some, difference } from 'lodash';

export type Board = (string | null)[]

/*
board indices topography
[0, 1, 2,
 3, 4, 5,
 6, 7, 8]
*/

export const generateEmptyTicTacToeBoard = () => Array(9).fill(null);

// All three variants place a piece the same way: on a cell of the board that is
// still empty.
export const validatePlacement = (board: Board, _, id: number): boolean =>
  Number.isInteger(id) && id >= 0 && id < board.length && board[id] === null;

export const hasWinningSubset = (indices: number[]) => {
  const winningIndexSets = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  const isSubsetOfIndices = (s: number[]) => difference(s, indices).length === 0;
  return some(winningIndexSets, isSubsetOfIndices);
};
