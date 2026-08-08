import type { Ctx, MoveOutcome } from 'strategy-game-factory';
import { random } from 'lodash';

// Chips in each of the three piles. The total is always even (it starts even
// and every move removes exactly two chips).
export type Board = number[]; // length 3

export type Move = [number, number]; // the two pile indices a move takes from

// A player can move iff at least two piles are non-empty (a move needs two
// distinct non-empty piles). Otherwise they lose.
export const canMove = (board: Board): boolean =>
  board.filter(v => v > 0).length >= 2;

export const isTerminal = (board: Board): boolean => !canMove(board);

export const applyMove = (board: Board, [i, j]: Move): Board =>
  board.map((v, idx) => (idx === i || idx === j ? v - 1 : v));

export const isPile = (i: number): boolean => Number.isInteger(i) && i >= 0 && i < 3;

// A move takes one chip from each of two *distinct* non-empty piles.
export const isTakeAllowed = (board: Board, i: number, j: number): boolean =>
  isPile(i) && isPile(j) && i !== j && board[i] > 0 && board[j] > 0;

export const getLegalMoves = (board: Board): Move[] => {
  const nonEmpty = board.map((_, i) => i).filter(i => board[i] > 0);
  const moves: Move[] = [];
  for (let a = 0; a < nonEmpty.length; a++) {
    for (let b = a + 1; b < nonEmpty.length; b++) {
      moves.push([nonEmpty[a], nonEmpty[b]]);
    }
  }
  return moves;
};

// --- Starting positions -----------------------------------------------------

const MAX_PER_PILE = 7; // keeps the total <= 20 with room for a few moves

// Every pile starts non-empty, so even piles are >= 2 and odd piles are >= 1.
const randomPositiveEven = (max: number): number => 2 * random(1, Math.floor(max / 2));
const randomOdd = (max: number): number => 2 * random(0, Math.floor((max - 1) / 2)) + 1;

const shuffledPositions = (): number[] => {
  const p = [0, 1, 2];
  for (let i = p.length - 1; i > 0; i--) {
    const j = random(0, i);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
};

// Half the starts are type (a) (all even — the second player wins) and half are
// type (b) (two odd, one even — the first player wins), so each role wins with
// ~50% probability across random starts.
export const generateStartBoard = (): Board => {
  while (true) {
    let board: Board;
    if (random(0, 1) === 0) {
      board = [randomPositiveEven(MAX_PER_PILE), randomPositiveEven(MAX_PER_PILE), randomPositiveEven(MAX_PER_PILE)];
    } else {
      const [evenPos, odd1, odd2] = shuffledPositions();
      board = [0, 0, 0];
      board[evenPos] = randomPositiveEven(MAX_PER_PILE);
      board[odd1] = randomOdd(MAX_PER_PILE);
      board[odd2] = randomOdd(MAX_PER_PILE);
    }
    const total = board[0] + board[1] + board[2];
    // Even total is guaranteed; require a non-trivial, playable position.
    if (total >= 4 && total <= 20 && canMove(board)) return board;
  }
};

export const moves = {
  takeChips: {
    validate: (board: Board, _, i: number, j: number) => isTakeAllowed(board, i, j),
    apply: (
      board: Board, { ctx }: { ctx: Ctx }, i: number, j: number
    ): MoveOutcome<Board> => {
      const nextBoard = applyMove(board, [i, j]);
      if (isTerminal(nextBoard)) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;
