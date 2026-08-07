import { cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Board = (number | null)[][]

const isGameEnd = (board: Board) => {
  return (
    board[0].filter(v => v !== null).length === 1 &&
    board[1].filter(v => v !== null).length === 1
  );
};

export const getWinnerIndex = (board: Board) => {
  if (!isGameEnd(board)) return undefined;
  const firstPlayerNumber = board[0].find(v => v !== null)!;
  const secondPlayerNumber = board[1].find(v => v !== null)!

  if (firstPlayerNumber === secondPlayerNumber) return 0;
  if ((firstPlayerNumber + secondPlayerNumber) % 2 === 0){
    return firstPlayerNumber < secondPlayerNumber ? 0 : 1;
  } else {
    return firstPlayerNumber > secondPlayerNumber ? 0 : 1;
  }
}

// Cards are addressed by their 1-based position in the other player's hand, and
// only a card still lying there may be taken.
export const isRemovalAllowed = (board: Board, opponent: number, id: number): boolean =>
  Number.isInteger(id) && id >= 1 && id <= board[opponent].length && board[opponent][id - 1] !== null;

export const moves = {
  removeCard: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, id: number) =>
      isRemovalAllowed(board, 1 - ctx.currentPlayer!, id),
    apply: (board: Board, { ctx }: { ctx: Ctx }, id: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[1 - ctx.currentPlayer!][id - 1] = null;
      // getWinnerIndex is undefined exactly while the game is still running.
      const winnerIndex = getWinnerIndex(nextBoard);
      if (winnerIndex !== undefined) {
        return { nextBoard, gameEnd: { winnerIndex } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
}

export type Moves = typeof moves;
