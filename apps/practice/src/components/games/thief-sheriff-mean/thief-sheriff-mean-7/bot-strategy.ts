import { sample } from 'lodash';
import { Sheriff, Thief, hasWinningTriple, getUntakenCards, type Board } from '../gameplay';
import { type BotStrategy } from '../../../strategy-game-factory';
import { applyTakeCard, CARD_COUNT, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

const TURN_PLAYER = [Sheriff, Thief, Sheriff, Thief, Sheriff];

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'takeCard', args: [sample(getUntakenCards(board, CARD_COUNT))!] });

export const smartBotStrategy: Bot = ({ board, ctx }) =>
  ({ move: 'takeCard', args: [getBotCard(board, ctx.currentPlayer!)] });

export const getBotCard = (board: Board, botPlayerIndex: number): number => {
  const memo = new Map<string, number>();
  const untaken = getUntakenCards(board, CARD_COUNT);
  const scores = untaken.map(card => {
    const nextBoard = applyTakeCard(board, botPlayerIndex, card);
    return minimax(nextBoard, botPlayerIndex, memo);
  });
  const best = Math.max(...scores);
  return sample(untaken.filter((_, i) => scores[i] === best))!;
};

export const getBotScore = (board: Board, botPlayerIndex: number): number => {
  return minimax(board, botPlayerIndex, new Map());
};

const minimax = (board: Board, botPlayerIndex: number, memo: Map<string, number>): number => {
  if (board.cards[Sheriff].length + board.cards[Thief].length === CARD_COUNT) {
    const winner = hasWinningTriple(board.cards[Thief]) ? Thief : Sheriff;
    return winner === botPlayerIndex ? 1 : -1;
  }

  const key =
    board.cards[Sheriff].slice().sort().join(',') + '|' +
    board.cards[Thief].slice().sort().join(',');
  if (memo.has(key)) return memo.get(key)!;

  const currentPlayer = TURN_PLAYER[board.numTurns];
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
