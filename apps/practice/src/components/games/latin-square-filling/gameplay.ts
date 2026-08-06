import type { MoveOutcome } from '../../strategy-game-factory';

// A 3x3 grid, row-major. 0 = empty, 1 | 2 | 3 = a written digit.
export type Board = number[]; // always length 9
export type Move = { cell: number; digit: number };

const rowOf = (cell: number): number => Math.floor(cell / 3);
const colOf = (cell: number): number => cell % 3;

export const generateStartBoard = (): Board => Array(9).fill(0);

export const isFull = (board: Board): boolean => board.every(v => v !== 0);

// Writing `digit` into empty `cell` is legal iff that digit is not already
// present in the cell's row or column (no row/column may hold two equal digits).
const isLegalPlacement = (board: Board, cell: number, digit: number): boolean => {
  if (!Number.isInteger(cell) || cell < 0 || cell >= 9) return false;
  if (![1, 2, 3].includes(digit)) return false;
  if (board[cell] !== 0) return false;
  const r = rowOf(cell), c = colOf(cell);
  for (let k = 0; k < 3; k++) {
    if (board[r * 3 + k] === digit) return false;
    if (board[k * 3 + c] === digit) return false;
  }
  return true;
};

export const legalDigits = (board: Board, cell: number): number[] =>
  [1, 2, 3].filter(digit => isLegalPlacement(board, cell, digit));

export const legalMoves = (board: Board): Move[] => {
  const moves: Move[] = [];
  for (let cell = 0; cell < 9; cell++) {
    if (board[cell] !== 0) continue;
    for (const digit of legalDigits(board, cell)) moves.push({ cell, digit });
  }
  return moves;
};

export const applyMove = (board: Board, { cell, digit }: Move): Board =>
  board.map((v, i) => (i === cell ? digit : v));

// One placement per turn and player 0 starts, so the player to move is fixed by
// how many cells are already filled.
export const playerToMove = (board: Board): number =>
  board.filter(v => v !== 0).length % 2;

// The turn ends the game when the board is full (player 0 wins — the 9th
// placement is always theirs) or when the player to move has no legal move
// (they are stuck, so player 1 wins).
export const isTerminal = (board: Board): boolean =>
  isFull(board) || legalMoves(board).length === 0;

export const moves = {
  placeDigit: {
    validate: (board: Board, _, cell: number, digit: number) => isLegalPlacement(board, cell, digit),
    apply: (board: Board, _, cell: number, digit: number): MoveOutcome<Board> => {
      const nextBoard = board.map((v, i) => (i === cell ? digit : v));
      if (isFull(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: 0 } };
      }
      // An empty cell remains but the next player has no legal digit for it.
      if (legalMoves(nextBoard).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: 1 } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
