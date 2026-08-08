import { sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { getWinnerIndex, isGameEnd, withCardTaken, type Board, type Card, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board, ctx }) =>
  ({ move: 'removeCard', args: [sample(board[1 - ctx.currentPlayer!])!] });

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const botPlayerIndex = ctx.currentPlayer!;

  let bestScore = -Infinity;
  let bestMoves: Card[] = [];

  for (const card of board[1 - botPlayerIndex]) {
    const next = withCardTaken(board, botPlayerIndex, card);
    const score = minimax(next, 1 - botPlayerIndex, botPlayerIndex);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [card];
    } else if (score === bestScore) {
      bestMoves.push(card);
    }
  }

  return { move: 'removeCard', args: [sample(bestMoves)!] };
};

// Return `+1` if the bot's player index won, `-1` otherwise.
const minimax = (board: Board, currentPlayer: number, botPlayerIndex: number): number => {
  if (isGameEnd(board)) return getWinnerIndex(board) === botPlayerIndex ? 1 : -1;

  const isMaximizing = currentPlayer === botPlayerIndex;
  let best = isMaximizing ? -Infinity : Infinity;

  for (const card of board[1 - currentPlayer]) {
    const next = withCardTaken(board, currentPlayer, card);
    const score = minimax(next, 1 - currentPlayer, botPlayerIndex);
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }

  return best;
};
