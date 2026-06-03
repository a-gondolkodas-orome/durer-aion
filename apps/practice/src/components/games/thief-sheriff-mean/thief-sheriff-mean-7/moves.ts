import { cloneDeep } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, type Board } from '../helpers';
import type { Ctx, Events } from '../../../game-factory';

export const CARD_COUNT = 7;

export const moves = {
  takeCard: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, indices: number[]): { nextBoard: Board } => {
    const nextBoard = cloneDeep(board);
    indices.forEach(idx => {
      nextBoard.cards[ctx.currentPlayer!].push(idx);
    });
    nextBoard.numTurns += 1;
    if (nextBoard.numTurns >= 5) {
      nextBoard.cards[Thief].push(...getUntakenCards(nextBoard, CARD_COUNT));
      const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
      events.endGame(winner);
    }
    events.endTurn();
    return { nextBoard };
  }
};
