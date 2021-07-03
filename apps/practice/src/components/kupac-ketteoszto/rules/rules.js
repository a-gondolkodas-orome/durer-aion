export const getBoardAfterPlayerStep = (board, { rowIndex, pieceIndex }) => {
  return [pieceIndex - 1, board[rowIndex] - pieceIndex + 1];
};

export const isGameEnd = board => board[0] === 1 && board[1] === 1;

export const generateNewBoard = function() {
  return [generateRandomIntBetween(3, 10), generateRandomIntBetween(3, 10)];
};

const generateRandomIntBetween = function(low, high) {
  return Math.floor(Math.random() * (high - low + 1)) + low;
};
