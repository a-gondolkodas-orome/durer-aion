import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { random, sample } from 'lodash';
import { type Board, validateTake } from '../gameplay';

export const moves = {
  take: {
    validate: validateTake,
    apply: (board: Board, { ctx }: { ctx: Ctx }, count: number): MoveOutcome<Board> => {
      // Next player may take strictly less than twice this take, i.e. up to 2·count − 1.
      const nextBoard: Board = { stones: board.stones - count, maxTake: 2 * count - 1 };
      if (nextBoard.stones === 0) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const startBoard = (stones: number): Board => ({ stones, maxTake: stones - 1 });

// Balanced starts: a power of 2 is a second-player win, everything else a
// first-player win, so picking a power of 2 ~half the time makes each role win
// with ~50% probability. The specific piles are hand-picked so optimal play
// stays lively: their winning opening removes a sizeable power-of-2 block rather
// than a single pebble (an odd pile would force a long run of forced 1-takes,
// since taking 1 caps the next player at 1 too).
export const generateStartBoard = (): Board => startBoard(
  random(0, 1)
    ? sample([16, 32])!
    : sample([20, 24, 40, 48])!
);

export const generateTestStartBoard = (): Board => startBoard(sample([8, 12, 16, 20])!);
