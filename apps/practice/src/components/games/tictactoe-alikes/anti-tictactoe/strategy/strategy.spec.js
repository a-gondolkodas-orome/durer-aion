import { generateNewBoard, getGameStateAfterAiMove, getGameStateAfterMove } from './strategy';

describe('Anti TicTacToe strategy', () => {
  describe('generateNewBoard', () => {
    it('should be a 9 element array of nulls', () => {
      expect(generateNewBoard()).toEqual([null, null, null, null, null, null, null, null, null]);
    });
  });

  describe('getGameStateAfterAiMove', () => {
    it('should place to middle place as a starting move', () => {
      const board = Array(9).fill(null);

      const result = getGameStateAfterAiMove(board, false);
      expect(result.board[4]).toEqual('red');
    });

    it('should place to central mirror image of item without mirror image', () => {
      expect(getGameStateAfterAiMove([
        'blue', null, null,
        null, 'red', null,
        null, null, null
      ], false).board[8]).toEqual('red');

      expect(getGameStateAfterAiMove([
        'blue', null, null,
        null, 'red', 'blue',
        null, null, 'red'
      ], false).board[3]).toEqual('red');
    });

    it('should not place to achieve 3 in a row if possible', () => {
      const board = [
        'blue', null, 'blue',
        'blue', 'red', 'red',
        'red', null, 'red'
      ];
      const result = getGameStateAfterAiMove(board, true);
      expect(result.board[1]).not.toEqual('blue');
    });
  });

  describe('getGameStateAfterMove', () => {
    it('should end game if there are 3 in a row', () => {
      const board = [
        'blue', 'blue', 'blue',
        'blue', 'red', 'red',
        'red', null, 'red'
      ];
      expect(getGameStateAfterMove(board).isGameEnd).toBe(true);
    });

    it('should end game if the table is full', () => {
      const board = [
        'blue', 'red', 'blue',
        'blue', 'red', 'red',
        'red', 'blue', 'red'
      ];
      expect(getGameStateAfterMove(board).isGameEnd).toBe(true);
      expect(getGameStateAfterMove(board).hasFirstPlayerWon).toBe(true);
    });

    it('should declare 2nd as winner even if they win at last piece', () => {
      const board = [
        'blue', 'blue', 'red',
        'blue', 'red', 'red',
        'red', 'red', 'blue'
      ];
      expect(getGameStateAfterMove(board).hasFirstPlayerWon).toBe(false);
    });
  });
});
