import { sample } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, type Board } from '../helpers';
import { type BotStrategy } from '../../../strategy-game-factory';
import { applyTakeCard, CARD_COUNT, type moves } from './moves';

type Bot = BotStrategy<Board, keyof typeof moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'takeCard', args: [sample(getUntakenCards(board, CARD_COUNT))] });

export const smartBotStrategy: Bot = ({ board, ctx }) =>
  ({ move: 'takeCard', args: [getBotCard(board, ctx.currentPlayer!)] });

// Shared across calls: minimax's score depends only on (cards, botPlayerIndex), so
// results from earlier moves/tests remain valid and are worth keeping. botPlayerIndex
// is part of the key since the same card state scores differently per perspective.
const minimaxMemo = new Map<string, number>();

export const getBotCard = (board: Board, botPlayerIndex: number): number => {
  const untaken = getUntakenCards(board, CARD_COUNT);
  const scores = untaken.map(card => {
    const nextBoard = applyTakeCard(board, botPlayerIndex, card);
    return minimax(nextBoard, botPlayerIndex, minimaxMemo);
  });
  const best = Math.max(...scores);
  return sample(untaken.filter((_, i) => scores[i] === best))!;
};

export const getBotScore = (board: Board, botPlayerIndex: number): number => {
  return minimax(board, botPlayerIndex, minimaxMemo);
};

const minimax = (board: Board, botPlayerIndex: number, memo: Map<string, number>): number => {
  const total = board.cards[Sheriff].length + board.cards[Thief].length;
  if (hasWinningTriple(board.cards[Thief]) || total === CARD_COUNT) {
    const winner = hasWinningTriple(board.cards[Thief]) ? Thief : Sheriff;
    return winner === botPlayerIndex ? 1 : -1;
  }

  const key =
    board.cards[Sheriff].slice().sort().join(',') + '|' +
    board.cards[Thief].slice().sort().join(',') + '|' + botPlayerIndex;
  if (memo.has(key)) return memo.get(key)!;

  const currentPlayer = board.numTurns % 2 === 0 ? Sheriff : Thief;
  const isMaximizing = currentPlayer === botPlayerIndex;
  let best = isMaximizing ? -Infinity : Infinity;
  for (const card of getUntakenCards(board, CARD_COUNT)) {
    const nextBoard = applyTakeCard(board, currentPlayer, card);
    const score = minimax(nextBoard, botPlayerIndex, memo);
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }

  memo.set(key, best);
  return best;
};
