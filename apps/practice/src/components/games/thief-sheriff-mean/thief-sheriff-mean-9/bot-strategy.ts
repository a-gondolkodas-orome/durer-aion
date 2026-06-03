import { sample } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, type Board } from '../helpers';
import { dummyEvents, makeCtx, type StrategyArgs } from '../../../game-factory';
import { moves, CARD_COUNT } from './moves';

export const randomBotStrategy = ({ board, moves: gameMoves }: StrategyArgs<Board>) => {
  gameMoves.takeCard(board, sample(getUntakenCards(board, CARD_COUNT)));
};

export const smartBotStrategy = ({ board, moves: gameMoves, ctx }: StrategyArgs<Board>) => {
  gameMoves.takeCard(board, getBotCard(board, ctx.currentPlayer!));
};

export const getBotCard = (board: Board, botPlayerIndex: number): number => {
  const memo = new Map<string, number>();
  const untaken = getUntakenCards(board, CARD_COUNT);
  const scores = untaken.map(card => {
    const { nextBoard } = moves.takeCard(
      board, { ctx: makeCtx({ currentPlayer: botPlayerIndex }), events: dummyEvents }, card
    );
    return minimax(nextBoard, botPlayerIndex, memo);
  });
  const best = Math.max(...scores);
  return sample(untaken.filter((_, i) => scores[i] === best))!;
};

export const getBotScore = (board: Board, botPlayerIndex: number): number => {
  return minimax(board, botPlayerIndex, new Map());
};

const minimax = (board: Board, botPlayerIndex: number, memo: Map<string, number>): number => {
  const total = board.cards[Sheriff].length + board.cards[Thief].length;
  if (hasWinningTriple(board.cards[Thief]) || total === CARD_COUNT) {
    const winner = hasWinningTriple(board.cards[Thief]) ? Thief : Sheriff;
    return winner === botPlayerIndex ? 1 : -1;
  }

  const key =
    board.cards[Sheriff].slice().sort().join(',') + '|' +
    board.cards[Thief].slice().sort().join(',');
  if (memo.has(key)) return memo.get(key)!;

  const currentPlayer = board.numTurns % 2 === 0 ? Sheriff : Thief;
  const isMaximizing = currentPlayer === botPlayerIndex;
  let best = isMaximizing ? -Infinity : Infinity;
  for (const card of getUntakenCards(board, CARD_COUNT)) {
    const { nextBoard } = moves.takeCard(
      board, { ctx: makeCtx({ currentPlayer }), events: dummyEvents }, card
    );
    const score = minimax(nextBoard, botPlayerIndex, memo);
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }

  memo.set(key, best);
  return best;
};
