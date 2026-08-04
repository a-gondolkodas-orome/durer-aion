import { cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from '../../../strategy-game-factory';
import { type Board, ARCHITECT, BANDITS, isArchitectStepAllowed, isDestructionAllowed } from '../gameplay';

export const generateStartBoard = (): Board => {
  const towers = Array(8).fill(false);
  /*
  Workaround to have a tower at the start of day 1, as startOfTurnMove or
  similar is not supported by framework.
  */
  towers[0] = true;
  return {
    architectPosition: 0,
    towers,
    day: 1,
    kmUsedToday: 0
  };
};

// The architect may walk this far along the wall each day.
export const KM_PER_DAY = 40;

export const moves = {
  moveArchitect: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, targetVertex: number) =>
      ctx.currentPlayer === ARCHITECT && isArchitectStepAllowed(board, targetVertex, KM_PER_DAY),
    // The architect keeps walking within the day, so the turn stays open until
    // `endDay`.
    apply: (board: Board, _, targetVertex): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.architectPosition = targetVertex;
      nextBoard.towers[targetVertex] = true;
      nextBoard.kmUsedToday += 10;
      return { nextBoard };
    }
  },

  endDay: {
    validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.currentPlayer === ARCHITECT,
    apply: (board: Board): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.kmUsedToday = 0;
      if (board.day === 4) {
        const allTowers = nextBoard.towers.every(t => t);
        return { nextBoard, gameEnd: { winnerIndex: allTowers ? ARCHITECT : BANDITS } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  destroyTower: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, vertex: number) =>
      ctx.currentPlayer === BANDITS && isDestructionAllowed(board, vertex),
    apply: (board: Board, _, vertex): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.towers[vertex] = false;
      return { nextBoard, autoEndOfTurn: true };
    }
  },
  startNextDay: {
    apply: (board: Board): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.day += 1;
      nextBoard.kmUsedToday = 0;
      nextBoard.towers[nextBoard.architectPosition] = true;
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
