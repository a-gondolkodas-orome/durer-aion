import { cloneDeep, last } from "lodash";
import type { Events } from '../../game-factory';

export type Board = { bacteria: number[][], goals: number[] };

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

const attackerMove = (type: MoveType) =>
  (board: Board, { events }: { events: Events }, { row, col }) => {
    const { nextBoard, reachedGoal } = applyAttackMove(board, { type, row, col });
    events.endTurn();
    if (reachedGoal) events.endGame();
    return { nextBoard };
  };

export const moves = {
  defend: (board: Board, { events }: { events: Events }, { row, col }) => {
    const nextBoard = cloneDeep(board);

    nextBoard.bacteria[row][col] -= 1;
    events.endTurn();

    if (areAllBacteriaRemoved(nextBoard.bacteria)) {
      events.endGame();
    }

    return { nextBoard };
  },
  shiftRight: attackerMove('shiftRight'),
  shiftLeft: attackerMove('shiftLeft'),
  jump: attackerMove('jump'),
  spread: attackerMove('spread')
};

export const isShiftRight = ({ attackRow, attackCol, row, col }) => {
  return attackRow === row && (col === (attackCol + 1));
};

export const isShiftLeft = ({ attackRow, attackCol, row, col }) => {
  return attackRow === row && (col === (attackCol - 1));
};

export const isSpread = ({ attackRow, attackCol, row, col }) => {
  return (
    row === attackRow + 1 &&
    (col === attackCol || col === attackCol + (-1) ** (1 + attackRow))
  );
};

export const isJump = ({ attackRow, attackCol, row, col }) => {
  return row === attackRow + 2 && col === attackCol;
};

export const isAllowedAttackClick = (attack) => {
  return (
    isShiftRight(attack) || isShiftLeft(attack) || isSpread(attack) || isJump(attack)
  );
};

const areAllBacteriaRemoved = (bacteria) => {
  for (let row = 0; row < bacteria.length; row++) {
    for (let col = 0; col <= lastCol(bacteria, row); col++) {
      if (bacteria[row][col] > 0) return false;
    }
  }
  return true;
};

export const lastCol = (bacteria, row) => bacteria[0].length - 0.5 - 0.5 * (-1) ** row;

/* Currently only correct for board with adjacent goals */
export const isDangerous = (board: Board, { row, col }) => {
  return distanceFromDangerousAttackZone(board, { row, col }).dist === 0;
};

export const distanceFromDangerousAttackZone = (board: Board, { row, col }) => {
  const boardWidth = board.bacteria[0].length;
  const goalRowIdx = board.bacteria.length - 1;
  const finalLeft = board.goals[0] === 0 ? 0 : board.goals[0] - 1;
  const leftEdge = finalLeft + Math.floor((goalRowIdx - row)/2);
  const finalRight = last(board.goals) === boardWidth - 1 ? boardWidth - 1 : last(board.goals)! + 1;
  const rightEdge = finalRight - Math.ceil((goalRowIdx - row)/2);
  if (board.goals[0] === 0) {
    if (col === 0 && row === (goalRowIdx - 2)) {
      return { dist: 0, dir: "center" };
    }
  }
  if (last(board.goals) === boardWidth - 1) {
    if (col === (boardWidth - 1) && row === (goalRowIdx - 2)) {
      return { dist: 0, dir: "center" };
    }
  }
  if (col >= leftEdge && col <= rightEdge) {
    return { dist: 0, dir: "center" };
  } else if (col < leftEdge) {
    return { dist: leftEdge - col, dir: "left" };
  } else {
    return { dist: col - rightEdge, dir: "right" };
  };
};

export const isOddEdge = (bacteria, { row, col }) =>
  (col === 0 || col === lastCol(bacteria, row)) && row % 2 === 0;
