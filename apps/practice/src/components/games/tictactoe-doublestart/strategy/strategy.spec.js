import { generateNewBoard, getGameStateAfterAiMove, getGameStateAfterMove } from './strategy';
import { range } from 'lodash-es';

describe('Double starter TicTacToe strategy', () => {
  describe('generateNewBoard', () => {
    it('should be a 9 element array of nulls', () => {
      expect(generateNewBoard()).toEqual([null, null, null, null, null, null, null, null, null]);
    });
  });

  describe('getGameStateAfterAiMove', () => {
    describe('AI is the first to move', () => {
      it('should place to two corners in same row as a starting move', () => {
        const board = Array(9).fill(null);

        const result = getGameStateAfterAiMove(board, false);

        expect([[0, 2], [2, 8], [6, 8], [0, 6]]).toContainEqual(
          range(0, 9).filter(i => result.board[i] === 'red')
        );
      });

      it('should place to middle field as a second move', () => {
        const board = [
          'red', 'blue', 'red',
          null, null, null,
          null, null, null
        ];

        const result = getGameStateAfterAiMove(board, false);
        expect(result.board[4]).toEqual('red');
      });

      it('should place to finish a winning row if possible', () => {
        const board = [
          'red', null, 'red',
          'blue', null, null,
          null, null, null
        ];

        const result = getGameStateAfterAiMove(board, false);
        expect(result.board[1]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });

      it('should place to finish a winning diagonal if possible', () => {
        const board = [
          'red', 'blue', 'red',
          null, 'red', null,
          null, null, 'blue'
        ];

        const result = getGameStateAfterAiMove(board, false);
        expect(result.board[6]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });

      it('should place to defend against 3 pieces in a row from other player', () => {
        const board = [
          'red', 'red', 'red',
          null, null, null,
          null, 'blue', 'blue'
        ];

        const result = getGameStateAfterAiMove(board, false);
        expect(result.board[6]).toEqual('red');
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

        const result = getGameStateAfterAiMove(board, true);
        expect(result.board[6]).toEqual('blue');
        expect(result.isGameEnd).toBe(true);
      });

      it('should attempt to block creating a red row 2 steps later', () => {
        const board = [
          null, 'red', null,
          null, 'blue', 'red',
          null, 'red', null
        ];

        const result = getGameStateAfterAiMove(board, true);
        // 2 or 8 would be equally good steps
        expect(result.board[8]).toEqual('blue');
      });

      it('should try to create a blue row', () => {
        const board = [
          'red', 'red', 'blue',
          null, 'red', null,
          null, null, null
        ];

        const result = getGameStateAfterAiMove(board, true);
        expect(result.board[8]).toEqual('blue');
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
      expect(result.hasFirstPlayerWon).toBe(false);
    });

    it('should end the game when there are 9 pieces', () => {
      const board = [
        'red', 'blue', 'red',
        'blue', 'red', 'blue',
        'red', 'red', 'blue'
      ];

      const result = getGameStateAfterMove(board);

      expect(result.isGameEnd).toBe(true);
      expect(result.hasFirstPlayerWon).toBe(true);
    });

    it('should end the game when there are 9 pieces but no winning subset', () => {
      const board = [
        'red', 'blue', 'red',
        'red', 'blue', 'red',
        'blue', 'red', 'blue'
      ];

      const result = getGameStateAfterMove(board);

      expect(result.isGameEnd).toBe(true);
      expect(result.hasFirstPlayerWon).toBe(false);
    });
  });
});
