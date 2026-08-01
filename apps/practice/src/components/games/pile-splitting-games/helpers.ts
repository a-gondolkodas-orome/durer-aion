import { cloneDeep, range } from 'lodash';

// The three sibling games differ only in how many piles they keep (2, 3 and 4);
// a board is the list of pile sizes and a turn is always the same two moves —
// remove one pile entirely, then split another in two.
type Board = number[];

// At the start of a turn every pile is non-empty, so the slot emptied by
// `removePile` is what marks the turn as half-done. That makes both halves of
// the turn legal purely as a function of the board, with no turn state.
export const emptiedPileId = (board: Board): number | undefined =>
  range(board.length).find(i => board[i] === 0);

const isPileId = (board: Board, pileId: number): boolean =>
  Number.isInteger(pileId) && pileId >= 0 && pileId < board.length;

// A pile may be removed only at the start of a turn, and only if the turn can
// then be finished: some *other* pile must have at least 2 pieces to split.
export const isRemovalAllowed = (board: Board, pileId: number): boolean =>
  isPileId(board, pileId)
    && emptiedPileId(board) === undefined
    && board.some((size, i) => i !== pileId && size >= 2);

// A split is legal only after a pile has been removed this turn, on one of the
// piles still standing, and both halves must get at least one piece.
export const isSplitAllowed = (board: Board, pileId: number, pieceCount: number): boolean =>
  isPileId(board, pileId)
    && emptiedPileId(board) !== undefined
    && Number.isInteger(pieceCount)
    && pieceCount >= 1
    && pieceCount <= board[pileId] - 1;

// The board `removePile` leaves behind. The board clients need it too: they must
// judge the split half of the turn before the removal has been dispatched.
export const withPileRemoved = (board: Board, pileId: number): Board => {
  const nextBoard = cloneDeep(board);
  nextBoard[pileId] = 0;
  return nextBoard;
};
