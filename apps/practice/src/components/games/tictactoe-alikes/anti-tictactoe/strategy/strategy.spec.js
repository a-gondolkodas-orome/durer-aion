import { getGameStateAfterAiTurn, getGameStateAfterMove } from './strategy';

describe('Anti TicTacToe strategy', () => {
  describe('getGameStateAfterAiTurn', () => {
    it('should place to middle place as a starting move', () => {
      const board = Array(9).fill(null);

      const result = getGameStateAfterAiTurn({ board, playerIndex: 1 });
      expect(result.newBoard[4]).toEqual('red');
    });

    it('should place to central mirror image of item without mirror image', () => {
      expect(getGameStateAfterAiTurn({ board: [
        'blue', null, null,
        null, 'red', null,
        null, null, null
      ], playerIndex: 1 }).newBoard[8]).toEqual('red');

      expect(getGameStateAfterAiTurn({ board: [
        'blue', null, null,
        null, 'red', 'blue',
        null, null, 'red'
      ], playerIndex: 1 }).newBoard[3]).toEqual('red');
    });

    it('should not place to achieve 3 in a row if possible', () => {
      const board = [
        'blue', null, 'blue',
        'blue', 'red', 'red',
        'red', null, 'red'
      ];
      const result = getGameStateAfterAiTurn({ board, playerIndex: 0 });
      expect(result.newBoard[1]).not.toEqual('blue');
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
      expect(getGameStateAfterMove(board).winnerIndex).toBe(0);
    });

    it('should declare 2nd as winner even if they win at last piece', () => {
      const board = [
        'blue', 'blue', 'red',
        'blue', 'red', 'red',
        'red', 'red', 'blue'
      ];
      expect(getGameStateAfterMove(board).winnerIndex).toBe(1);
    });
  });
});
