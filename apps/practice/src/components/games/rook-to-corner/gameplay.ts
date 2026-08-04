import type { Ctx, MoveOutcome } from '../../strategy-game-factory';
import { random, some, isEqual, cloneDeep } from 'lodash';

export type Field = { row: number; col: number };
export type Board = { rookPosition: Field };

export const boardSize = 8;
export const target: Field = { row: boardSize - 1, col: boardSize - 1 };

export const isTarget = (field: Field): boolean =>
  field.row === target.row && field.col === target.col;

// A move goes right (same row, larger col) or down (same col, larger row),
// any number of squares.
export const getAllowedMoves = (board: Board): Field[] => {
  const { row, col } = board.rookPosition;
  const moves: Field[] = [];
  for (let c = col + 1; c < boardSize; c++) moves.push({ row, col: c });
  for (let r = row + 1; r < boardSize; r++) moves.push({ row: r, col });
  return moves;
};

// The rook starts on a random square. Half the time we start on a P-position
// (on the main diagonal, row === col), where the player to move loses with
// optimal play; the other half on an N-position (off the diagonal), where the
// player to move wins. This keeps the two roles balanced at ~50/50.
//
// We never start inside the bottom-right 3 × 3 corner (rows and cols both in
// the last 3): the rook only moves toward that corner, so starting there makes
// the game too short and too easy. This also excludes the bottom-right target
// square itself (the game would already be over there).
const cornerSize = 3;
const isInBottomRightCorner = ({ row, col }: Field): boolean =>
  row >= boardSize - cornerSize && col >= boardSize - cornerSize;

export const generateStartBoard = (): Board => {
  if (random(0, 1) === 0) {
    // P-position on the diagonal, excluding the bottom-right corner.
    const d = random(0, boardSize - cornerSize - 1);
    return { rookPosition: { row: d, col: d } };
  }
  // N-position off the diagonal, outside the bottom-right corner.
  let rookPosition: Field;
  do {
    rookPosition = { row: random(0, boardSize - 1), col: random(0, boardSize - 1) };
  } while (rookPosition.row === rookPosition.col || isInBottomRightCorner(rookPosition));
  return { rookPosition };
};

export const moves = {
  moveRook: {
    validate: (board: Board, _, target: Field) =>
      some(getAllowedMoves(board), field => isEqual(field, target)),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Field): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.rookPosition = { row, col };

      if (isTarget({ row, col })) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
