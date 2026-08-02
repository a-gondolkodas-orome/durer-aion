import { cloneDeep } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, isCardAvailable, type Board } from '../helpers';
import type { Ctx, Events } from '../../../strategy-game-factory';

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
    legacyApply: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, idx: number): { nextBoard: Board } => {
      const nextBoard = applyTakeCard(board, ctx.currentPlayer!, idx);
      if (nextBoard.numTurns === 8) {
        const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
        events.endGame(winner);
      } else if (hasWinningTriple(nextBoard.cards[Thief])) {
        events.endGame(Thief);
      }
      events.endTurn();
      return { nextBoard };
    }
  }
};
