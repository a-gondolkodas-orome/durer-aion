import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

export type Board = number[]
export type MoveType = 'remove' | 'merge'
export type TurnState = { firstSelectedPile: number } | null

// Empty piles never survive a move (removeOne drops a pile it empties), so any
// pile still on the table has a match to take.
export const isPile = (board: Board, pileIndex: number): boolean =>
  Number.isInteger(pileIndex) && pileIndex >= 0 && pileIndex < board.length;

// Merging needs two piles, and they have to be different ones.
export const isMergeAllowed = (board: Board, piles: number[]): boolean =>
  Array.isArray(piles) && piles.length === 2
    && isPile(board, piles[0]) && isPile(board, piles[1]) && piles[0] !== piles[1];

export const moves = {
  removeOne: {
    validate: (board: Board, _, pileIndex: number) => isPile(board, pileIndex),
    apply: (board: Board, { ctx }: { ctx: Ctx }, pileIndex: number): MoveOutcome<Board> => {
      const newSize = board[pileIndex] - 1;
      const nextBoard = [
        ...board.slice(0, pileIndex),
        ...(newSize > 0 ? [newSize] : []),
        ...board.slice(pileIndex + 1)
      ];
      // Taking the last match leaves the opponent nothing to take.
      if (nextBoard.length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  mergePiles: {
    validate: (board: Board, _, piles: number[]) => isMergeAllowed(board, piles),
    apply: (board: Board, _, [pileIndex1, pileIndex2]: number[]): MoveOutcome<Board> => {
      const [firstIdx, secondIdx] = [pileIndex1, pileIndex2].sort((a, b) => a - b);
      const merged = board[firstIdx] + board[secondIdx];
      const nextBoard = board.filter((_, i) => i !== firstIdx && i !== secondIdx);
      nextBoard.splice(firstIdx, 0, merged);
      // A merge never empties the board, so it can only ever end the turn.
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
