import { cloneDeep } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, type Board } from '../helpers';
import type { Ctx, Events } from '../../../strategy-game-factory';

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
  takeCard: (board: Board, { ctx, events }: { ctx: Ctx, events: Events }, indices: number[]): { nextBoard: Board } => {
    const nextBoard = applyTakeCard(board, ctx.currentPlayer!, indices);
    if (nextBoard.numTurns >= 5) {
      const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
      events.endGame(winner);
    }
    events.endTurn();
    return { nextBoard };
  }
};
