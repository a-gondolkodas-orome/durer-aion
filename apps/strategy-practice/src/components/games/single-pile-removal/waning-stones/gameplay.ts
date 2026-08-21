import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { range, random, sample } from 'lodash';
import { type Board, validateTake } from '../gameplay';

export const moves = {
  take: {
    validate: validateTake,
    apply: (board: Board, { ctx }: { ctx: Ctx }, count: number): MoveOutcome<Board> => {
      const nextBoard: Board = { stones: board.stones - count, maxTake: count };
      if (nextBoard.stones === 0) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const startBoard = (stones: number): Board => ({ stones, maxTake: Math.floor(stones / 2) });

// Balanced starts: a power of 2 is a second-player win, everything else a
// first-player win, so picking a power of 2 ~half the time makes each role win
// with ~50% probability.
export const generateStartBoard = (): Board => startBoard(
  random(0, 1)
    ? sample([8, 16, 32, 64])!
    : sample(range(8, 66).filter(n => (n & (n - 1)) !== 0))!
);

export const generateTestStartBoard = (): Board => startBoard(sample([6, 8, 9, 10, 12])!);
