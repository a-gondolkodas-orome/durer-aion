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
