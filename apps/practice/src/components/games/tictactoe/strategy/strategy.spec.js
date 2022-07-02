import { generateNewBoard, getGameStateAfterAiMove, inPlacingPhase } from './strategy';

describe('TicTacToe strategy', () => {
  describe('generateNewBoard', () => {
    it('should be a 9 element array of nulls', () => {
      expect(generateNewBoard()).toEqual([null, null, null, null, null, null, null, null, null]);
    });
  });

  describe('inPlacingPhase', () => {
    it('should return true if board has empty place', () => {
      expect(inPlacingPhase([null, 'blue', 'red', 'red', 'red', 'blue', 'blue', 'blue', 'red'])).toBe(true);
    });

    it('should return false if board does not have empty place', () => {
      expect(inPlacingPhase(['blue', 'red', 'red', 'white', 'red', 'white', 'blue', 'blue', 'white'])).toBe(false);
    });
  });

  describe('getGameStateAfterAiMove', () => {
    describe('new piece placing phase', () => {
      it('should win the game in 1 move if possible', () => {
        const board = [
          'red', 'red', null,
          null, null, null,
          'blue', 'blue', null
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[2]).toEqual('red');
        expect(result.isGameEnd).toBe(true);
      });

      it('should win the game in 1 move if possible for 0th place as well', () => {
        const board = [
          null, 'red', 'red',
          null, null, null,
          'blue', 'blue', null
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[0]).toEqual('red');
        expect(result.isGameEnd).toBe(true);
      });

      it('should identify a diagonal winning position', () => {
        const board = [
          'blue', 'blue', 'red',
          null, 'red', null,
          null, null, 'blue'
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[6]).toEqual('red');
        expect(result.isGameEnd).toBe(true);
      });

      it('should place to player winning place', () => {
        const board = [
          'blue', 'blue', 'red',
          'blue', null, null,
          null, 'red', null
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[6]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });

      it('should place to middle place if still empty', () => {
        const board = [
          'blue', null, null,
          null, null, null,
          null, null, null
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[4]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });

      it('should not place to middle place as a first move', () => {
        const board = [
          null, null, null,
          null, null, null,
          null, null, null
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[4]).not.toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });

      it('should place to corner if middle is not empty', () => {
        const board = [
          null, null, null,
          null, 'blue', null,
          null, null, null
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[0]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });

      it('should place to defending corner if 1 diagonal is occupied', () => {
        const board = [
          'red', null, null,
          null, 'blue', null,
          null, null, 'blue'
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[2]).toEqual('red');
        expect(result.isGameEnd).toBe(false);
      });
    });

    describe('board is already full phase', () => {
      it('should color middle field to white if allowed', () => {
        const board = [
          'red', 'blue', 'red',
          'red', 'blue', 'blue',
          'blue', 'red', 'blue'
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[4]).toEqual('white');
        expect(result.isGameEnd).toBe(false);
      });

      it('should win the game in one move is possible', () => {
        const board = [
          'red', 'blue', 'red',
          'white', 'white', 'blue',
          'blue', 'red', 'blue'
        ];

        const result = getGameStateAfterAiMove(board);
        expect(result.board[5]).toEqual('white');
        expect(result.isGameEnd).toBe(true);
      });

      describe('r b r, b r b, b r b scenario', () => {
        it('should color 3 to white (and similarly in rotated scenarios)', () => {
          expect(getGameStateAfterAiMove([
            'red', 'blue', 'red',
            'blue', 'red', 'blue',
            'blue', 'red', 'blue'
          ]).board[3]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'blue', 'red',
            'red', 'red', 'blue',
            'blue', 'blue', 'red'
          ]).board[1]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'red', 'blue',
            'blue', 'red', 'blue',
            'red', 'blue', 'red'
          ]).board[5]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'red', 'blue', 'blue',
            'blue', 'red', 'red',
            'red', 'blue', 'blue'
          ]).board[7]).toEqual('white');
        });

        it('should color 8 to white as 3rd if no instant win (and similarly in rotated scenarios)', () => {
          expect(getGameStateAfterAiMove([
            'red', 'blue', 'white',
            'white', 'red', 'blue',
            'blue', 'red', 'blue'
          ]).board[8]).toEqual('white');
          expect(getGameStateAfterAiMove([
            'red', 'blue', 'red',
            'white', 'red', 'blue',
            'blue', 'white', 'blue'
          ]).board[8]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'white', 'red',
            'white', 'red', 'blue',
            'blue', 'blue', 'red'
          ]).board[6]).toEqual('white');
          expect(getGameStateAfterAiMove([
            'blue', 'white', 'red',
            'red', 'red', 'blue',
            'blue', 'blue', 'white'
          ]).board[6]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'white', 'blue',
            'blue', 'red', 'white',
            'red', 'blue', 'red'
          ]).board[0]).toEqual('white');
          expect(getGameStateAfterAiMove([
            'blue', 'red', 'blue',
            'blue', 'red', 'white',
            'white', 'blue', 'red'
          ]).board[0]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'red', 'blue', 'blue',
            'blue', 'red', 'white',
            'red', 'white', 'blue'
          ]).board[2]).toEqual('white');
          expect(getGameStateAfterAiMove([
            'white', 'blue', 'blue',
            'blue', 'red', 'red',
            'red', 'white', 'blue'
          ]).board[2]).toEqual('white');
        });
      });

      describe('r b b, b r r, b r b scenario', () => {
        it('should color 2 to white (and similarly in rotated scenarios)', () => {
          expect(getGameStateAfterAiMove([
            'red', 'blue', 'blue',
            'blue', 'red', 'red',
            'blue', 'red', 'blue'
          ]).board[2]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'blue', 'red',
            'red', 'red', 'blue',
            'blue', 'red', 'blue'
          ]).board[8]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'red', 'blue',
            'red', 'red', 'blue',
            'blue', 'blue', 'red'
          ]).board[6]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'red', 'blue',
            'blue', 'red', 'red',
            'red', 'blue', 'blue'
          ]).board[0]).toEqual('white');
        });

        it('should color 3 to white (and similarly in rotated scenarios)', () => {
          expect(getGameStateAfterAiMove([
            'red', 'blue', 'white',
            'blue', 'red', 'red',
            'blue', 'white', 'blue'
          ]).board[3]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'blue', 'red',
            'white', 'red', 'blue',
            'blue', 'red', 'white'
          ]).board[1]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'blue', 'white', 'blue',
            'red', 'red', 'blue',
            'white', 'blue', 'red'
          ]).board[5]).toEqual('white');

          expect(getGameStateAfterAiMove([
            'white', 'red', 'blue',
            'blue', 'red', 'white',
            'red', 'blue', 'blue'
          ]).board[7]).toEqual('white');
        });
      });
    });
  });
});
