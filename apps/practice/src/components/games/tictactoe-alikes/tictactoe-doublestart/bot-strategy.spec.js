import { aiBotStrategy } from './bot-strategy';

describe('Double starter TicTacToe strategy', () => {
  describe('AI is the first to move', () => {
    it('should place to middle field as a second move', () => {
      const board = [
        'red', 'blue', 'red',
        null, null, null,
        null, null, null
      ];

      const moves = { placePiece: (board, id) => board[id] = 'red' }

      aiBotStrategy({ board, ctx: { chosenRoleIndex: 1 }, moves });
      expect(board[4]).toEqual('red');
    });

    it('should place to finish a winning diagonal if possible', () => {
      const board = [
        'red', 'blue', 'red',
        null, 'red', null,
        null, null, 'blue'
      ];

      const moves = { placePiece: (board, id) => board[id] = 'red' }

      aiBotStrategy({ board, ctx: { chosenRoleIndex: 1 }, moves });
      expect(board[6]).toEqual('red');
    });

    it('should place to defend against 3 pieces in a row from other player', () => {
      const board = [
        'red', 'red', 'red',
        null, null, null,
        null, 'blue', 'blue'
      ];

      const moves = { placePiece: (board, id) => board[id] = 'red' }

      aiBotStrategy({ board, ctx: { chosenRoleIndex: 1 }, moves });
      expect(board[6]).toEqual('red');
    });
  });

  describe('AI is the second to move', () => {
    it('should place third blue piece in a row if possible', () => {
      const board = [
        'red', 'red', 'red',
        null, null, 'red',
        null, 'blue', 'blue'
      ];

      const moves = { placePiece: (board, id) => board[id] = 'blue' }
      aiBotStrategy({ board, ctx: { chosenRoleIndex: 0 }, moves });
      expect(board[6]).toEqual('blue');
    });

    it('should try to create a blue row', () => {
      const board = [
        'red', 'red', 'blue',
        null, 'red', null,
        null, null, null
      ];

      const moves = { placePiece: (board, id) => board[id] = 'blue' }
      aiBotStrategy({ board, ctx: { chosenRoleIndex: 0 }, moves });
      expect(board[8]).toEqual('blue');
    });
  });
});
