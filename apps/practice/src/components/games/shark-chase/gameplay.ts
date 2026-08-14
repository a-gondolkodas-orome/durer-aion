import { cloneDeep } from 'lodash';
import type { Ctx, MoveOutcome } from 'strategy-game-factory';

// Both variants play the same chase, differing only in how many sectors a side
// of the lake has (4 vs 5) and how many days the shark must survive.
export type Board = { submarines: number[]; shark: number; turn: number; sharkMovesInTurn: number }

// The two players move different pieces, so which of them is to move is part of
// a move's legality rather than merely of whose turn it is.
export const [RESEARCHERS, SHARK] = [0, 1];

// The lake is square, so its side follows from the number of sectors: 16 → 4,
// 25 → 5. Nothing has to tell the predicates below which variant they are in.
export const sideLength = (board: Board): number => Math.sqrt(board.submarines.length);

// Sectors are numbered row by row, so how far apart two of them are is the
// Manhattan distance between their (row, column) coordinates.
export const distance = (fieldA: number, fieldB: number, size: number): number =>
  Math.abs((fieldA % size) - (fieldB % size)) +
  Math.abs(Math.floor(fieldA / size) - Math.floor(fieldB / size));

const isSector = (board: Board, id: number): boolean =>
  Number.isInteger(id) && id >= 0 && id < board.submarines.length;

// A submarine swims out of a sector it occupies into a side-adjacent one.
export const isSubmarineMoveAllowed = (board: Board, from: number, to: number): boolean =>
  isSector(board, from) && isSector(board, to)
    && board.submarines[from] >= 1
    && distance(from, to, sideLength(board)) === 1;

// The shark swims into a side-adjacent sector — or stays put, which is how it
// gives up the second half of its night.
export const isSharkMoveAllowed = (board: Board, to: number): boolean =>
  isSector(board, to) && distance(board.shark, to, sideLength(board)) <= 1;

// The rules are the same chase on both lakes; only the last day differs, so it
// is the one thing the moves are built with. The lake's size they read off the
// board.
export const makeGameplay = (maxTurn: number) => {
  const isGameEnd = (board: Board): boolean =>
    board.submarines[board.shark] >= 1 || board.turn > maxTurn;

  const getWinnerIndex = (board: Board): number =>
    board.submarines[board.shark] >= 1 ? RESEARCHERS : SHARK;

  const moves = {
    moveSubmarine: {
      validate: (board: Board, { ctx }: { ctx: Ctx }, move: { from: number; to: number }) =>
        ctx.currentPlayer === RESEARCHERS && !!move && isSubmarineMoveAllowed(board, move.from, move.to),
      apply: (
        board: Board, _, { from, to }: { from: number; to: number }
      ): MoveOutcome<Board> => {
        const nextBoard = cloneDeep(board);
        nextBoard.submarines[from] -= 1;
        nextBoard.submarines[to] += 1;
        if (isGameEnd(nextBoard)) {
          return { nextBoard, gameEnd: { winnerIndex: getWinnerIndex(nextBoard) } };
        }
        return { nextBoard, isTurnEnd: true };
      }
    },
    moveShark: {
      validate: (board: Board, { ctx }: { ctx: Ctx }, to: number) =>
        ctx.currentPlayer === SHARK && isSharkMoveAllowed(board, to),
      apply: (board: Board, _, to: number): MoveOutcome<Board> => {
        const nextBoard = cloneDeep(board);
        nextBoard.shark = to;

        const isAnotherSharkMoveAllowed = (
          board.submarines[to] === 0 &&
            to !== board.shark &&
            board.sharkMovesInTurn === 0
        );
        // A free first step earns a second one, so the turn stays open.
        if (isAnotherSharkMoveAllowed) {
          nextBoard.sharkMovesInTurn = 1;
          return { nextBoard };
        }

        nextBoard.turn += 1;
        nextBoard.sharkMovesInTurn = 0;
        if (isGameEnd(nextBoard)) {
          return { nextBoard, gameEnd: { winnerIndex: getWinnerIndex(nextBoard) } };
        }
        return { nextBoard, isTurnEnd: true };
      }
    }
  };

  return { isGameEnd, getWinnerIndex, moves };
};
