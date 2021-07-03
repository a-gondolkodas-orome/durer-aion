export const getBoardAfterPlayerStep = (board, { rowIndex, pieceIndex }) => {
  return [pieceIndex - 1, board[rowIndex] - pieceIndex + 1];
};
