import { cloneDeep } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, isCardAvailable, type Board } from '../gameplay';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

export const CARD_COUNT = 9;

export const applyTakeCard = (board: Board, player: number, idx: number): Board => {
  const nextBoard = cloneDeep(board);
  nextBoard.cards[player].push(idx);
  nextBoard.numTurns += 1;
  if (nextBoard.numTurns === 8) {
    nextBoard.cards[Sheriff].push(getUntakenCards(nextBoard, CARD_COUNT)[0]);
  }
  return nextBoard;
};

export const moves = {
  takeCard: {
    validate: (board: Board, _, idx: number) => isCardAvailable(board, CARD_COUNT, idx),
    apply: (board: Board, { ctx }: { ctx: Ctx }, idx: number): MoveOutcome<Board> => {
      const nextBoard = applyTakeCard(board, ctx.currentPlayer!, idx);
      if (nextBoard.numTurns === 8) {
        const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
        return { nextBoard, gameEnd: { winnerIndex: winner } };
      }
      if (hasWinningTriple(nextBoard.cards[Thief])) {
        return { nextBoard, gameEnd: { winnerIndex: Thief } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

