import { makeCtx } from '../../../../test-utils';
import { inPlacingPhase, isWhiteningAllowed, moves, type Board } from './gameplay';

// vsHuman keeps the colours independent of role choice: player 0 is blue, so the
// other player's colour is red.
const ctxForFirstPlayer = makeCtx({ isHumanVsHumanGame: true, currentPlayer: 0 });
const ctxForSecondPlayer = makeCtx({ isHumanVsHumanGame: true, currentPlayer: 1 });

const fullBoard: Board = [
  'blue', 'red', 'blue',
  'red', 'blue', 'red',
  'red', 'blue', 'red'
];

describe('helpers', () => {
  describe('inPlacingPhase', () => {
    it('should return true if board has empty place', () => {
      expect(inPlacingPhase([null, 'blue', 'red', 'red', 'red', 'blue', 'blue', 'blue', 'red'])).toBe(true);
    });

    it('should return false if board does not have empty place', () => {
      expect(inPlacingPhase(['blue', 'red', 'red', 'white', 'red', 'white', 'blue', 'blue', 'white'])).toBe(false);
    });
  });

  describe('isWhiteningAllowed', () => {
    it('rejects any whitening while empty cells remain', () => {
      const partialBoard: Board = [...fullBoard.slice(0, 8), null];
      expect(isWhiteningAllowed(partialBoard, ctxForFirstPlayer, 1)).toBe(false);
    });

    it("allows whitening the other player's piece on a full board", () => {
      expect(isWhiteningAllowed(fullBoard, ctxForFirstPlayer, 1)).toBe(true);
      expect(isWhiteningAllowed(fullBoard, ctxForSecondPlayer, 0)).toBe(true);
    });

    it('rejects whitening an own piece', () => {
      expect(isWhiteningAllowed(fullBoard, ctxForFirstPlayer, 0)).toBe(false);
      expect(isWhiteningAllowed(fullBoard, ctxForSecondPlayer, 1)).toBe(false);
    });

    it('rejects whitening an already whitened piece', () => {
      const board: Board = [...fullBoard];
      board[1] = 'white';
      expect(isWhiteningAllowed(board, ctxForFirstPlayer, 1)).toBe(false);
    });
  });
});

// 'red' is player 0, 'blue' is player 1, in board order.
const grid = (cells: (string | null)[]) => cells;

describe('tictactoe end of game', () => {
  // Which colour a placement writes depends on the mode, so these run in
  // human-vs-human, where player 0 is blue and player 1 is red.
  const vsHuman = (currentPlayer: number) =>
    ({ ctx: makeCtx({ currentPlayer, isHumanVsHumanGame: true }) });

  it('ends for the mover when placing completes a line', () => {
    const board = grid(['blue', 'blue', null, 'red', 'red', null, null, null, null]);
    const outcome = moves.placePiece.apply(board, vsHuman(0), 2);
    expect(outcome.nextBoard[2]).toBe('blue');
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
    expect(outcome.isTurnEnd).toBeUndefined();
  });

  it('ends for the mover when whitening completes a line of whites', () => {
    // whitening cell 2 leaves three whites across the top row
    const board = grid(['white', 'white', 'red', 'blue', 'red', 'blue', 'red', 'blue', 'red']);
    const outcome = moves.whitenPiece.apply(board, vsHuman(1), 2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('passes the turn on an ordinary placement', () => {
    const outcome = moves.placePiece.apply(grid(Array(9).fill(null)), vsHuman(0), 4);
    expect(outcome.gameEnd).toBeUndefined();
    expect(outcome.isTurnEnd).toBe(true);
  });
});
