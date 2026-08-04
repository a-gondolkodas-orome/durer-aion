import { emptiedPileId, isRemovalAllowed, isSplitAllowed, withPileRemoved } from '../gameplay';
import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { range, random, isEqual, cloneDeep } from 'lodash';

export const generateStartBoard = (): Board => {
  if (random(0, 1)) return generateWinningStartBoard();
  return generateLosingStartBoard();
};

export const generateTestStartBoard = (): Board => {
  if (random(0, 1)) return generateWinningStartBoard(5, 3, 6);
  return generateLosingStartBoard(5, 3, 6);
};


const generateWinningStartBoard = (remainingTrials = 50, pileMin = 5, pileMax = 12): Board => {
  const board = [
    random(pileMin, pileMax),
    random(pileMin, pileMax),
    random(pileMin, pileMax),
    random(pileMin, pileMax)
  ];
  if (!canWin(board)) {
    if (remainingTrials > 0) {
      return generateWinningStartBoard(remainingTrials - 1);
    }
    return board;
  }

  const r = random(0, 2);
  if (r === 0) return board;
  if (r === 1) return board.map(x => x * 2);
  const modifiedBoard = board.map(x => x * 2);
  modifiedBoard[random(0, 3)] -= 1;
  return modifiedBoard;
};

const generateLosingStartBoard = (remainingTrials = 50, pileMin = 5, pileMax = 12): Board => {
  const board = [
    random(pileMin, pileMax),
    random(pileMin, pileMax),
    random(pileMin, pileMax),
    random(pileMin, pileMax)
  ];
  if (canWin(board)) {
    if (remainingTrials > 0) {
      return generateLosingStartBoard(remainingTrials - 1);
    }
    return board;
  }

  const r = random(0, 2);
  if (r === 0) return board;
  if (r === 1) return board.map(x => x * 2);
  const modifiedBoard = board.map(x => x * 2);
  modifiedBoard[random(0, 3)] -= 1;
  return modifiedBoard;
};

// Can the player to move force a win? Recursive parity normalisation.
const canWin = (board: Board): boolean => {
  const oddPileIndices = range(0, 4).filter(i => board[i] % 2 === 1);
  const oddPileCount = oddPileIndices.length;

  if (oddPileCount === 4) return true;
  if (oddPileCount === 3 || oddPileCount === 2) return false;

  if (oddPileCount === 1) {
    const modifiedBoard = [...board];
    modifiedBoard[oddPileIndices[0]] += 1;
    return canWin(modifiedBoard);
  } else { // oddPileCount === 0
    return canWin(board.map(x => x / 2));
  }
};

export type Board = number[];
export type Piece = { pileId: number; pieceId: number };

export const moves = {
  removePile: {
    validate: (board: Board, _, pileId: number) => isRemovalAllowed(board, pileId),
    // First half of the turn: empty a pile, then split another into it — the
    // turn stays open in between.
    apply: (board: Board, _, pileId: number): MoveOutcome<Board> =>
      ({ nextBoard: withPileRemoved(board, pileId) })
  },
  splitPile: {
    validate: (board: Board, _, { pileId, pieceCount }: { pileId: number; pieceCount: number }) =>
      isSplitAllowed(board, pileId, pieceCount),
    apply: (
      board: Board,
      { ctx }: { ctx: Ctx },
      { pileId, pieceCount }: { pileId: number; pieceCount: number }
    ): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      // the slot emptied earlier this turn takes the other half of the split
      const removedPileId = emptiedPileId(nextBoard)!;
      if (removedPileId < pileId) {
        nextBoard[removedPileId] = pieceCount;
        nextBoard[pileId] = nextBoard[pileId] - pieceCount;
      } else {
        nextBoard[removedPileId] = nextBoard[pileId] - pieceCount;
        nextBoard[pileId] = pieceCount;
      }
      // All piles down to a single piece: the opponent cannot split anything.
      if (isEqual(nextBoard, [1, 1, 1, 1])) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
