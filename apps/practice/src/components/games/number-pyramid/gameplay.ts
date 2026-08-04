import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { applyMoveToBoard, isCombineAllowed, type Board } from './strategy';

export const moves = {
  combineTwo: {
    validate: (board: Board, _, move) => isCombineAllowed(board, move),
    apply: (
      board: Board,
      { ctx }: { ctx: Ctx },
      { levelIdx, indices }
    ): MoveOutcome<Board> => {
      const { nextBoard, combinedValue } = applyMoveToBoard(board, levelIdx, indices);

      // nextTurnState clears the half-made selection the BoardClient parked in
      // ctx.turnState while the player was picking the second slot.
      if (combinedValue >= board.target) {
        return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, nextTurnState: null, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
