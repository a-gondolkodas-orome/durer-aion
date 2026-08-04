import { sum, isEqual, sample, range } from 'lodash';
import type { BotMove, BotStrategy } from '../../../strategy-game-factory';
import type { Board, Moves } from './five-squares';

type Bot = BotStrategy<Board, Moves>

// The second player places two squares per turn, chosen together (see
// bestPairs), so the turn is named as a whole.
const asTurn = (squares: number[]): BotMove<Moves>[] =>
  squares.map(square => ({ move: 'addPiece', args: [square] }));

const randomSquare = () => sample(range(5))!;

export const randomBotStrategy: Bot = ({ ctx }) =>
  asTurn(ctx.currentPlayer === 1 ? [randomSquare(), randomSquare()] : [randomSquare()]);

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const botPlayerIndex = ctx.currentPlayer!;
  if (botPlayerIndex === 1) {
    return asTurn(sample(bestPairs(board, botPlayerIndex))!);
  } else {
    const scores = range(5).map(i => {
      const next = [...board] as Board;
      next[i]++;
      return minimax(next, 1, botPlayerIndex);
    });
    const best = Math.max(...scores);
    const bestTiles = range(5).filter(i => scores[i] === best);
    return asTurn([sample(bestTiles)!]);
  }
};

const bestPairs = (board: Board, botPlayerIndex: number): [number, number][] => {
  let best = -Infinity;
  const result: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = i; j < 5; j++) {
      const next = [...board] as Board;
      next[i]++;
      next[j]++;
      const score = minimax(next, 0, botPlayerIndex);
      if (score > best) {
        best = score;
        result.length = 0;
        result.push([i, j]);
      } else if (score === best) {
        result.push([i, j]);
      }
    }
  }
  return result;
};

// Return `+1` if the bot's player index won, `-1` otherwise.
const minimax = (board: Board, currentPlayer: number, botPlayerIndex: number): number => {
  if (sum(board) === 10) {
    const winnerIndex = isEqual([...board].sort(), [0, 1, 2, 3, 4]) ? 1 : 0;
    return winnerIndex === botPlayerIndex ? 1 : -1;
  }
  const isMaximizing = currentPlayer === botPlayerIndex;
  let best = isMaximizing ? -Infinity : Infinity;
  if (currentPlayer === 0) {
    for (let i = 0; i < 5; i++) {
      const next = [...board] as Board;
      next[i]++;
      const score = minimax(next, 1, botPlayerIndex);
      best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      for (let j = i; j < 5; j++) {
        const next = [...board] as Board;
        next[i]++;
        next[j]++;
        const score = minimax(next, 0, botPlayerIndex);
        best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
      }
    }
  }
  return best;
};
