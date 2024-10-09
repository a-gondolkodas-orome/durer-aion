import { getGameStateAfterAiTurn, getGameStateAfterMove } from './strategy';
import { range } from 'lodash';

describe('Double starter TicTacToe strategy', () => {
  describe('getGameStateAfterAiTurn', () => {
    describe('AI is the first to move', () => {
      it('should place to two corners in same row as a starting move', () => {
        const board = Array(9).fill(null);

        const result = getGameStateAfterAiTurn({ board, ctx: { playerIndex: 1 } });

        expect([[0, 2], [2, 8], [6, 8], [0, 6]]).toContainEqual(
          range(0, 9).filter(i => result.nextBoard[i] === 'red')
        );
      });

      it('should place to middle field as a second move', () => {
        const board = [
          'red', 'blue', 'red',
          null, null, null,
          null, null, null
        ];

        const result = getGameStateAfterAiTurn({ board, ctx: { playerIndex: 1 } });
        expect(result.nextBoard[4]).toEqual('red');
      });

      it('should place to finish a winning diagonal if possible', () => {
        const board = [
          'red', 'blue', 'red',
          null, 'red', null,
          null, null, 'blue'
        ];

        const result = getGameStateAfterAiTurn({ board, ctx: { playerIndex: 1 } });
        expect(result.nextBoard[6]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });

      it('should place to defend against 3 pieces in a row from other player', () => {
        const board = [
          'red', 'red', 'red',
          null, null, null,
          null, 'blue', 'blue'
        ];

        const result = getGameStateAfterAiTurn({ board, ctx: { playerIndex: 1 } });
        expect(result.nextBoard[6]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });
    });

    describe('AI is the second to move', () => {
      it('should place third blue piece in a row if possible', () => {
        const board = [
          'red', 'red', 'red',
          null, null, 'red',
          null, 'blue', 'blue'
        ];

        const result = getGameStateAfterAiTurn({ board, ctx: { playerIndex: 0 } });
        expect(result.nextBoard[6]).toEqual('blue');
        expect(result.isGameEnd).toBe(true);
      });

      it('should try to create a blue row', () => {
        const board = [
          'red', 'red', 'blue',
          null, 'red', null,
          null, null, null
        ];

        const result = getGameStateAfterAiTurn({ board, ctx: { playerIndex: 0 } });
        expect(result.nextBoard[8]).toEqual('blue');
      });
    });
  });

  describe('getGameStateAfterMove', () => {
    it('should end the game if there are 3 pieces in a row for the second player', () => {
      const board = [
        'red', 'red', 'red',
        'blue', 'blue', 'blue',
        'red', null, null
      ];

      const result = getGameStateAfterMove(board);

      expect(result.isGameEnd).toBe(true);
      expect(result.winnerIndex).toBe(1);
    });

    it('should end the game when there are 9 pieces', () => {
      const board = [
        'red', 'blue', 'red',
        'blue', 'red', 'blue',
        'red', 'red', 'blue'
      ];

      const result = getGameStateAfterMove(board);

      expect(result.isGameEnd).toBe(true);
      expect(result.winnerIndex).toBe(0);
    });

    it('should end the game when there are 9 pieces but no winning subset', () => {
      const board = [
        'red', 'blue', 'red',
        'red', 'blue', 'red',
        'blue', 'red', 'blue'
      ];

      const result = getGameStateAfterMove(board);

      expect(result.isGameEnd).toBe(true);
      expect(result.winnerIndex).toBe(1);
    });
  });
});
