import { flatMap, range, cloneDeep } from "lodash";

export const [DUCK, FORBIDDEN] = [1, 2];

export const getBoardIndices = (rows, cols) =>
  flatMap(range(0, rows), row => range(0, cols).map(col => ({ row, col })));

export const getAllowedMoves = (board) => {
  const boardIndices = getBoardIndices(board.length, board[0].length);
  return boardIndices.filter(({ row, col }) => board[row][col] === null);
};

export const markForbiddenFields = (board, { row, col }) => {
  const rows = board.length;
  const cols = board[0].length;
  if (row - 1 >= 0) {
    board[(row - 1)][col] = FORBIDDEN;
  }
  if (row + 1 <= (rows - 1)) {
    board[(row + 1)][col] = FORBIDDEN;
  }
  if (col - 1 >= 0) {
    board[(row)][col - 1] = FORBIDDEN;
  }
  if (col + 1 <= (cols - 1)) {
    board[(row)][col + 1] = FORBIDDEN;
  }
};

export const moves = {
  placeDuck: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);
    nextBoard[row][col] = DUCK;
    markForbiddenFields(nextBoard, { row, col });
    events.endTurn();
    if (getAllowedMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
};
