import { cloneDeep } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, isCardAvailable, type Board } from '../helpers';
import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';

export const CARD_COUNT = 7;

export const applyTakeCard = (board: Board, player: number, indices: number[]): Board => {
  const nextBoard = cloneDeep(board);
  indices.forEach(idx => {
    nextBoard.cards[player].push(idx);
  });
  nextBoard.numTurns += 1;
  if (nextBoard.numTurns >= 5) {
    nextBoard.cards[Thief].push(...getUntakenCards(nextBoard, CARD_COUNT));
  }
  return nextBoard;
};

export const moves = {
  takeCard: {
    // A step takes a single card; the sweep of whatever is left at the end of
    // the game happens inside `applyTakeCard`, not as a move argument.
    validate: (board: Board, _, indices: number[]) =>
      Array.isArray(indices) && indices.length === 1 && isCardAvailable(board, CARD_COUNT, indices[0]),
    apply: (
      board: Board, { ctx }: { ctx: Ctx }, indices: number[]
    ): MoveOutcome<Board> => {
      const nextBoard = applyTakeCard(board, ctx.currentPlayer!, indices);
      if (nextBoard.numTurns >= 5) {
        const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
        return { nextBoard, gameEnd: { winnerIndex: winner } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

