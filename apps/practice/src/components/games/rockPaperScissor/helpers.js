import { some, difference } from 'lodash';

/*
board indices topography
[0, 1, 2,
 3, 4, 5,
 6, 7, 8]
*/

export const generateEmptyTicTacToeBoard = () => Array(9).fill(null);

export const hasWinningSubset = (indices) => {
  const winningIndexSets = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  const isSubsetOfIndices = s => difference(s, indices).length === 0;
  return some(winningIndexSets, isSubsetOfIndices);
};
