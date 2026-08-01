import { makeCtx } from '../../../../test-utils';
import { inPlacingPhase, isWhiteningAllowed, type Board } from "./helpers";

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
