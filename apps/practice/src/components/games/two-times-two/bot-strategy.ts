import { sum, isEqual, sample, range } from 'lodash';
import type { StrategyArgs } from '../../game-factory';
import type { Board } from './two-times-two';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.addPiece(board, sample(range(0, 4)));
};

export const smartBotStrategy = ({ board, moves, ctx }: StrategyArgs<Board>) => {
  const botPlayerIndex = ctx.currentPlayer!;
  const scores = range(0, 4).map(i => {
    const next = [...board] as Board;
    next[i]++;
    return minimax(next, 1 - botPlayerIndex, botPlayerIndex);
  });
  const best = Math.max(...scores);
  const bestTiles = range(0, 4).filter(i => scores[i] === best);
  moves.addPiece(board, sample(bestTiles));
};

// Return `+1` if the bot's player index won, `-1` otherwise.
const minimax = (board: Board, currentPlayer: number, botPlayerIndex: number): number => {
  if (sum(board) === 6) {
    const winnerIndex = isEqual([...board].sort(), [0, 1, 2, 3]) ? 1 : 0;
    return winnerIndex === botPlayerIndex ? 1 : -1;
  }
  const isMaximizing = currentPlayer === botPlayerIndex;
  let best = isMaximizing ? -Infinity : Infinity;
  for (let i = 0; i < 4; i++) {
    const next = [...board] as Board;
    next[i]++;
    const score = minimax(next, 1 - currentPlayer, botPlayerIndex);
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
};
