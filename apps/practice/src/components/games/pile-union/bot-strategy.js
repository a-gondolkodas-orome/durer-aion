import { sample, sortBy, sum } from 'lodash';

const memo = new Map();

const isLosing = (board) => {
  const sorted = sortBy(board);
  const key = sorted.join(',');
  if (memo.has(key)) return memo.get(key);
  if (sorted.length === 0) { memo.set(key, true); return true; }

  const hasWinningMove = sorted.some((size, i) => {
    const afterRemove = sorted.filter((_, idx) => idx !== i);
    if (size > 1) afterRemove.push(size - 1);
    if (isLosing(afterRemove)) return true;
    return sorted.slice(i + 1).some((_, rel) => {
      const j = i + 1 + rel;
      const afterMerge = sorted.filter((_, idx) => idx !== i && idx !== j);
      afterMerge.push(sorted[i] + sorted[j]);
      return isLosing(afterMerge);
    });
  });

  memo.set(key, !hasWinningMove);
  return !hasWinningMove;
};

/*
P = Previous player wins (the player who just moved wins)
N = Next player wins — the current player to move has a winning move available
*/
export const aiBotStrategy = ({ board, moves }) => {
  const T = sum(board) + board.length;

  if (T % 2 === 0) {
    // N position: simple deterministic strategy — always move to T odd with all piles ≥ 2
    if (board.length === 1) {
      // Single pile: just remove from it
      moves.removeOne(board, 0);
      return;
    }
    const size1Idx = board.findIndex(x => x === 1);
    if (size1Idx !== -1) {
      // Merge the size-1 pile away so all piles stay ≥ 2
      moves.mergePiles(board, [size1Idx, size1Idx === 0 ? 1 : 0]);
      return;
    }
    // All piles ≥ 2: remove from any pile of size ≥ 3, or merge if all are size 2
    const bigPileIdx = board.findIndex(x => x >= 3);
    if (bigPileIdx !== -1) {
      moves.removeOne(board, bigPileIdx);
    } else {
      moves.mergePiles(board, [0, 1]);
    }
  } else {
    // P position: use memo to capitalise on opponent mistakes, otherwise random
    const winningMoves = [];
    const allMoves = [];
    board.forEach((_, i) => {
      allMoves.push({ type: 'remove', i });
      const next = board.filter((_, idx) => idx !== i);
      if (board[i] > 1) next.push(board[i] - 1);
      if (isLosing(next)) winningMoves.push({ type: 'remove', i });
    });
    for (let i = 0; i < board.length; i++) {
      for (let j = i + 1; j < board.length; j++) {
        allMoves.push({ type: 'merge', i, j });
        const next = board.filter((_, idx) => idx !== i && idx !== j);
        next.push(board[i] + board[j]);
        if (isLosing(next)) winningMoves.push({ type: 'merge', i, j });
      }
    }
    const chosen = sample(winningMoves.length > 0 ? winningMoves : allMoves);
    if (chosen.type === 'remove') {
      moves.removeOne(board, chosen.i);
    } else {
      moves.mergePiles(board, [chosen.i, chosen.j]);
    }
  }
};

export const randomBotStrategy = ({ board, moves }) => {
  const winIn1 = [];
  board.forEach((_, i) => {
    const next = board.filter((_, idx) => idx !== i);
    if (board[i] > 1) next.push(board[i] - 1);
    if (next.length === 0) winIn1.push({ type: 'remove', i });
  });

  const allMoves = [];
  board.forEach((_, i) => allMoves.push({ type: 'remove', i }));
  for (let i = 0; i < board.length; i++) {
    for (let j = i + 1; j < board.length; j++) allMoves.push({ type: 'merge', i, j });
  }

  const chosen = sample(winIn1.length > 0 ? winIn1 : allMoves);
  if (chosen.type === 'remove') {
    moves.removeOne(board, chosen.i);
  } else {
    moves.mergePiles(board, [chosen.i, chosen.j]);
  }
};
