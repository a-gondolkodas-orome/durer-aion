import { cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export type Board = ('rock' | 'paper' | 'scissor' | null)[][]

const isGameEnd = (board: Board) => {
  const remaining = (row: Board[number]) => row.filter(symbol => symbol !== null).length;
  return remaining(board[0]) === 1 && remaining(board[1]) === 1;
};

// A card's index is its symbol: 0 = rock, 1 = paper, 2 = scissor. Each symbol
// beats the one two places along, so rock beats scissor, paper beats rock and
// scissor beats paper.
const beats = (a: number, b: number) => b === (a + 2) % 3;

const getWinnerIndex = (board: Board) => {
  if (!isGameEnd(board)) return undefined;
  const first = board[0].findIndex(symbol => symbol !== null);
  const second = board[1].findIndex(symbol => symbol !== null);
  // Two cards showing the same symbol go to the starting player, so the second
  // player only takes the round by beating them outright.
  return beats(second, first) ? 1 : 0;
};

export const moves = {
  removeSymbol: {
    // Only a symbol the other player still holds may be taken away.
    validate: (board: Board, { ctx }: { ctx: Ctx }, idx: number) => {
      const opponent = 1 - ctx.currentPlayer!;
      return Number.isInteger(idx) && idx >= 0 && idx < board[opponent].length
        && board[opponent][idx] !== null;
    },
    apply: (board: Board, { ctx }: { ctx: Ctx }, idx: number): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard[1 - ctx.currentPlayer!][idx] = null;
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
