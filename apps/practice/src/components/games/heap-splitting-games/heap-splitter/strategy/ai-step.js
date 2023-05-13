'use strict';

import { random } from 'lodash-es';
import { generateRandomEvenBetween } from '../../../../../lib/generate-random';

export const getAiStep = (board) => {
  const randomHeapIndex = random(0, 1);

  const HeapIndexToSplit = (board[randomHeapIndex] % 2 === 0 || board[1 - randomHeapIndex] === 1)
    ? randomHeapIndex
    : 1 - randomHeapIndex;

  const pieceId = getOptimalDivision(board[HeapIndexToSplit]);
  return { heapId: HeapIndexToSplit, pieceId };
};

const getOptimalDivision = (pieceCountInHeap) => {
  if (pieceCountInHeap === 2) return 0;

  return generateRandomEvenBetween(0, pieceCountInHeap - 2);
};
