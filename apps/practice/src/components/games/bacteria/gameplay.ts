import { cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

export type Board = { bacteria: number[][], goals: number[] };
export type Cell = { row: number; col: number };
// A cell paired with the attacking cell it is being judged against.
export type AttackZone = Cell & { attackRow: number; attackCol: number };

// Board geometry ------------------------------------------------------------
// Rows are indexed from the bottom (row 0 = start row, last row = goal row).
// Wide rows (even index) have one more cell than narrow rows (odd index).
// A single bacterium climbs one row at a time, either straight or diagonally,
// exactly matching the two targets of a cell division (spread):
//   even row -> (r+1, c) and (r+1, c-1)
//   odd  row -> (r+1, c) and (r+1, c+1)

export const rowWidth = (board: Board, row: number) => board.bacteria[row]?.length ?? 0;
export const wideWidth = (board: Board) => board.bacteria[0].length;
export const topRowIdx = (board: Board) => board.bacteria.length - 1;

export const inBoard = (board: Board, row: number, col: number) =>
  row >= 0 && row < board.bacteria.length && col >= 0 && col < rowWidth(board, row);

export const isGoalCell = (board: Board, row: number, col: number) =>
  row === topRowIdx(board) && board.goals.includes(col);

// The two cells a bacterium on (row, col) reaches when climbing one row.
export const spreadChildren = (board: Board, row: number, col: number) => {
  const diag = col + (row % 2 === 0 ? -1 : 1);
  return ([[row + 1, col], [row + 1, diag]] as [number, number][])
    .filter(([r, c]) => inBoard(board, r, c));
};

// Board utilities -----------------------------------------------------------
export const bacteriaCoords = (board: Board): [number, number][] => {
  const coords: [number, number][] = [];
  for (let r = 0; r < board.bacteria.length; r++) {
    for (let c = 0; c < board.bacteria[r].length; c++) {
      if (board.bacteria[r][c] > 0) coords.push([r, c]);
    }
  }
  return coords;
};

export const totalBacteria = (board: Board) =>
  board.bacteria.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);

export const removeOne = (board: Board, row: number, col: number): Board => {
  const next = cloneDeep(board);
  next.bacteria[row][col] -= 1;
  return next;
};

// Attacker moves ------------------------------------------------------------
export type MoveType = 'shiftRight' | 'shiftLeft' | 'jump' | 'spread';
export type AttackMove = { type: MoveType; row: number; col: number };

// Pure attacker move: returns the next board, the cells reached, and whether a
// goal was reached. Single source of truth for both real play (`moves` below)
// and bot look-ahead (bot-strategy.ts `simulate`).
export const applyAttackMove = (board: Board, { type, row, col }: AttackMove) => {
  const nextBoard = cloneDeep(board);
  let reached: [number, number][];
  if (type === 'jump') {
    nextBoard.bacteria[row][col] -= 1;
    nextBoard.bacteria[row + 2][col] += 1;
    reached = [[row + 2, col]];
  } else {
    if (type === 'shiftRight') {
      reached = [[row, col + 1]];
    } else if (type === 'shiftLeft') {
      reached = [[row, col - 1]];
    } else { // spread
      reached = spreadChildren(board, row, col);
    }
    const count = board.bacteria[row][col];
    nextBoard.bacteria[row][col] = 0;
    for (const [r, c] of reached) nextBoard.bacteria[r][c] += count;
  }
  const reachedGoal = reached.some(([r, c]) => isGoalCell(board, r, c));
  return { nextBoard, reached, reachedGoal };
};

export const [ATTACKER, DEFENDER] = [0, 1];

// Every move of either player starts from a cell that holds at least one
// bacterium.
export const hasBacterium = (board: Board, { row, col }: Cell): boolean =>
  inBoard(board, row, col) && board.bacteria[row][col] >= 1;

// An attack additionally needs somewhere to go: the sideways step, the two-row
// jump and at least one of the division's two children must land on the board.
// Without this a spread from the top row would simply delete the bacteria.
export const isAttackAllowed = (board: Board, { type, row, col }: AttackMove): boolean => {
  if (!hasBacterium(board, { row, col })) return false;
  if (type === 'shiftRight') return inBoard(board, row, col + 1);
  if (type === 'shiftLeft') return inBoard(board, row, col - 1);
  if (type === 'jump') return inBoard(board, row + 2, col);
  return spreadChildren(board, row, col).length >= 1;
};

const attackerMove = (type: MoveType) => ({
  validate: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Cell) =>
    ctx.currentPlayer === ATTACKER && isAttackAllowed(board, { type, row, col }),
  apply: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Cell): MoveOutcome<Board> => {
    const { nextBoard, reachedGoal } = applyAttackMove(board, { type, row, col });
    if (reachedGoal) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
    return { nextBoard, isTurnEnd: true };
  }
});

export const moves = {
  defend: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, cell: Cell) =>
      ctx.currentPlayer === DEFENDER && hasBacterium(board, cell),
    apply: (board: Board, { ctx }: { ctx: Ctx }, { row, col }: Cell): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.bacteria[row][col] -= 1;

      if (areAllBacteriaRemoved(nextBoard.bacteria)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  },
  shiftRight: attackerMove('shiftRight'),
  shiftLeft: attackerMove('shiftLeft'),
  jump: attackerMove('jump'),
  spread: attackerMove('spread')
};

export type Moves = typeof moves;

export const isShiftRight = ({ attackRow, attackCol, row, col }: AttackZone) => {
  return attackRow === row && (col === (attackCol + 1));
};

export const isShiftLeft = ({ attackRow, attackCol, row, col }: AttackZone) => {
  return attackRow === row && (col === (attackCol - 1));
};

export const isSpread = ({ attackRow, attackCol, row, col }: AttackZone) => {
  return (
    row === attackRow + 1 &&
    (col === attackCol || col === attackCol + (-1) ** (1 + attackRow))
  );
};

export const isJump = ({ attackRow, attackCol, row, col }: AttackZone) => {
  return row === attackRow + 2 && col === attackCol;
};

const areAllBacteriaRemoved = (bacteria: number[][]) => {
  for (let row = 0; row < bacteria.length; row++) {
    for (let col = 0; col <= lastCol(bacteria, row); col++) {
      if (bacteria[row][col] > 0) return false;
    }
  }
  return true;
};

const lastCol = (bacteria: number[][], row: number) => bacteria[0].length - 0.5 - 0.5 * (-1) ** row;
