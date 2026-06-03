import { cloneDeep } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, type Board } from '../helpers';
import type { Ctx, Events } from '../../../game-factory';

export const CARD_COUNT = 9;

export const moves = {
  takeCard: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, idx: number): { nextBoard: Board } => {
    const nextBoard = cloneDeep(board);
    nextBoard.cards[ctx.currentPlayer!].push(idx);
    nextBoard.numTurns += 1;
    if (nextBoard.numTurns === 8) {
      nextBoard.cards[Sheriff].push(getUntakenCards(nextBoard, CARD_COUNT)[0]);
      const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
      events.endGame(winner);
    } else if (hasWinningTriple(nextBoard.cards[Thief])) {
      events.endGame(Thief);
    }
    events.endTurn();
    return { nextBoard };
  }
};
