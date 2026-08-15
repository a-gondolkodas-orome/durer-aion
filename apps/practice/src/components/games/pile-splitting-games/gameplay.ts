import { range } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

// The three sibling games are one game played with a different number of piles
// (2, 3 and 4): a board is the list of pile sizes, and a turn is always the
// same two moves — remove one pile entirely, then split another in two. The
// pile count is the only thing that varies between them, and `board.length`
// already carries it, so they share these moves outright.
export type Board = number[];
export type Piece = { pileId: number; pieceId: number };
type Split = { pileId: number; pieceCount: number };

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
  const nextBoard = [...board];
  nextBoard[pileId] = 0;
  return nextBoard;
};

export const moves = {
  removePile: {
    validate: (board: Board, _, pileId: number) => isRemovalAllowed(board, pileId),
    // First half of the turn: empty a pile, then split another into it — the
    // turn stays open in between.
    apply: (board: Board, _, pileId: number): MoveOutcome<Board> =>
      ({ nextBoard: withPileRemoved(board, pileId) })
  },
  splitPile: {
    validate: (board: Board, _, { pileId, pieceCount }: Split) =>
      isSplitAllowed(board, pileId, pieceCount),
    apply: (
      board: Board,
      { ctx }: { ctx: Ctx },
      { pileId, pieceCount }: Split
    ): MoveOutcome<Board> => {
      const nextBoard = [...board];
      // The two halves take the split pile's own slot and the one emptied
      // earlier this turn, the first half in the lower of the two so that the
      // board keeps reading left to right.
      const [lower, upper] = [pileId, emptiedPileId(board)!].sort((a, b) => a - b);
      nextBoard[lower] = pieceCount;
      nextBoard[upper] = board[pileId] - pieceCount;

      // Every pile down to a single piece: the opponent cannot split anything.
      if (nextBoard.every(size => size === 1)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

// Which side can force the win, on 2, 3 and 4 piles alike. A turn leaves every
// pile odd exactly when it splits an even pile into two odd halves and discards
// the second even pile if there is one — so a mover facing no even pile has
// already lost, and one facing a single even pile, or two, has won. Past two
// the turn cannot decide it, and the position reduces instead: halving every
// pile leaves the class untouched, as does topping the lone odd pile up to
// even, and both shrink the board.
//
// This characterises the winning strategy, so it would belong with the bot were
// it not what `pile-splitter-4` draws its start boards against — the exception
// AGENTS.md § Files in a game folder makes for a practice game's generator.
export const isLosingForMover = (board: Board): boolean => {
  const evenPileCount = board.filter(size => size % 2 === 0).length;

  if (evenPileCount === 0) return true;
  if (evenPileCount <= 2) return false;
  if (evenPileCount === board.length) return isLosingForMover(board.map(size => size / 2));

  // Every pile but one even, which on this family's widest board means four
  // piles around a single odd one. Five piles could reach here with two odd
  // ones, which this does not answer.
  const oddPileId = board.findIndex(size => size % 2 === 1);
  return isLosingForMover(board.map((size, i) => i === oddPileId ? size + 1 : size));
};
