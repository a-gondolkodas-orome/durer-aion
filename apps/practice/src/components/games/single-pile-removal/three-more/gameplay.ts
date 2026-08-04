import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { range, random, sample } from 'lodash';
import { type Board, validateTake } from '../gameplay';

// You may take up to three more than the other player's last take.
export const INCREMENT = 3;
// The opening move is capped at four pebbles.
const OPENING_MAX = 4;

export const moves = {
  take: {
    validate: validateTake,
    apply: (board: Board, { ctx }: { ctx: Ctx }, count: number): MoveOutcome<Board> => {
      const nextBoard: Board = { stones: board.stones - count, maxTake: count + INCREMENT };
      if (nextBoard.stones === 0) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

const startBoard = (stones: number): Board => ({ stones, maxTake: OPENING_MAX });

// Balanced starts: from the opening position the second player wins exactly when
// n ≡ 0, 5 or 7 (mod 11); everything else is a first-player win. Picking a
// second-player-win pile ~half the time makes each role win with ~50% probability.
const isSecondPlayerWin = (n: number): boolean => [0, 5, 7].includes(n % 11);
const STONE_RANGE = range(12, 41); // piles large enough to be non-trivial
const secondPlayerWins = STONE_RANGE.filter(isSecondPlayerWin);
const firstPlayerWins = STONE_RANGE.filter(n => !isSecondPlayerWin(n));

export const generateStartBoard = (): Board => startBoard(
  random(0, 1) ? sample(secondPlayerWins)! : sample(firstPlayerWins)!
);
