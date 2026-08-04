import { sample, range } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import { type Board, getWinnerIndex, type Moves } from './five-five-card';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board, ctx }) => {
  const opponentIdx = ctx.chosenRoleIndex!;
  const validIds = range(1, 6).filter(id => board[opponentIdx][id - 1] !== null);
  return { move: 'removeCard', args: [sample(validIds)!] };
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const botPlayerIndex = ctx.currentPlayer!;
  const opponentIdx = 1 - botPlayerIndex;

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (let i = 0; i < 5; i++) {
    if (board[opponentIdx][i] === null) continue;
    const nextBoard = board.map(row => [...row]);
    nextBoard[opponentIdx][i] = null;
    const score = minimax(nextBoard, 1 - botPlayerIndex, botPlayerIndex);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [i + 1];
    } else if (score === bestScore) {
      bestMoves.push(i + 1);
    }
  }

  return { move: 'removeCard', args: [sample(bestMoves)!] };
};

// Return `+1` if the bot's player index won, `-1` otherwise.
const minimax = (board: Board, currentPlayer, botPlayerIndex): number => {
  const winner = getWinnerIndex(board);
  if (winner !== undefined) return winner === botPlayerIndex ? 1 : -1;

  const opponentIdx = 1 - currentPlayer;
  const isMaximizing = currentPlayer === botPlayerIndex;
  let best = isMaximizing ? -Infinity : Infinity;

  for (let i = 0; i < 5; i++) {
    if (board[opponentIdx][i] === null) continue;
    const nextBoard = board.map(row => [...row]);
    nextBoard[opponentIdx][i] = null;
    const score = minimax(nextBoard, 1 - currentPlayer, botPlayerIndex);
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }

  return best;
};
