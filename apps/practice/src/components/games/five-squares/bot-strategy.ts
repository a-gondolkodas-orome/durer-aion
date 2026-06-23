import { sum, isEqual, sample, range } from 'lodash';
import type { StrategyArgs } from '../../game-factory';
import type { Board } from './five-squares';

export const randomBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  if (ctx.currentPlayer === 1) {
    const { nextBoard } = moves.addPiece(board, sample(range(5)));
    setTimeout(() => {
      moves.addPiece(nextBoard, sample(range(5)));
    }, 750);
  } else {
    moves.addPiece(board, sample(range(5)));
  }
};

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const botPlayerIndex = ctx.currentPlayer!;
  if (botPlayerIndex === 1) {
    const pairs = bestPairs(board, botPlayerIndex);
    const pair = sample(pairs)!;
    const { nextBoard } = moves.addPiece(board, pair[0]);
    setTimeout(() => {
      moves.addPiece(nextBoard, pair[1]);
    }, 750);
  } else {
    const scores = range(5).map(i => {
      const next = [...board] as Board;
      next[i]++;
      return minimax(next, 1, botPlayerIndex);
    });
    const best = Math.max(...scores);
    const bestTiles = range(5).filter(i => scores[i] === best);
    moves.addPiece(board, sample(bestTiles));
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
