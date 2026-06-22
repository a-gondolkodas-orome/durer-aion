import { smartBotStrategy } from './bot-strategy';
import type { Board } from './helpers';
import { makeCtx, type GameMoves } from '../../../game-factory';

const mockPlacePiece = (): GameMoves<Board> => ({
  placePiece: (board: Board, id: number) => { board[id] = 'new_piece'; return { nextBoard: board }; }
});

const mockWhitenPiece = (): GameMoves<Board> => ({
  whitenPiece: (board: Board, id: number) => { board[id] = 'white'; return { nextBoard: board }; }
});

describe('smartBotStrategy', () => {
  describe('new piece placing phase', () => {
    it('should win the game in 1 move if possible', () => {
      const board = [
        'red', 'red', null,
        null, null, null,
        'blue', 'blue', null
      ];
      const moves = mockPlacePiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(board[2]).toEqual('new_piece');
    });

    it('should win the game in 1 move if possible for 0th place as well', () => {
      const board = [
        null, 'red', 'red',
        null, null, null,
        'blue', 'blue', null
      ];
      const moves = mockPlacePiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(board[0]).toEqual('new_piece');
    });

    it('should identify a diagonal winning position', () => {
      const board = [
        'blue', 'blue', 'red',
        null, 'red', null,
        null, null, 'blue'
      ];
      const moves = mockPlacePiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(board[6]).toEqual('new_piece');
    });

    it('should place to player winning place', () => {
      const board = [
        'blue', 'blue', 'red',
        'blue', null, null,
        null, 'red', null
      ];
      const moves = mockPlacePiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(board[6]).toEqual('new_piece');
    });

    it('should place to middle place if still empty', () => {
      const board = [
        'blue', null, null,
        null, null, null,
        null, null, null
      ];
      const moves = mockPlacePiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(board[4]).toEqual('new_piece');
    });

    it('should place to corner if middle is not empty', () => {
      const board = [
        null, null, null,
        null, 'blue', null,
        null, null, null
      ];
      const moves = mockPlacePiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(
        board[0] === 'new_piece' || board[2] === 'new_piece' ||
        board[6] === 'new_piece' || board[8] === 'new_piece'
      ).toBe(true);
    });

    it('should place to defending corner if 1 diagonal is occupied', () => {
      const board = [
        'red', null, null,
        null, 'blue', null,
        null, null, 'blue'
      ];
      const moves = mockPlacePiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(
        board[2] === 'new_piece' || board[6] === 'new_piece'
      ).toBe(true);
    });
  });

  describe('board is already full phase', () => {
    it('should color middle field to white if allowed', () => {
      const board = [
        'red', 'blue', 'red',
        'red', 'blue', 'blue',
        'blue', 'red', 'blue'
      ];
      const moves = mockWhitenPiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(board[4]).toEqual('white');
    });

    it('should win the game in one move is possible', () => {
      const board = [
        'red', 'blue', 'red',
        'white', 'white', 'blue',
        'blue', 'red', 'blue'
      ];
      const moves = mockWhitenPiece();

      smartBotStrategy({ board, ctx: makeCtx(), moves });

      expect(board[5]).toEqual('white');
    });

    describe('r b r, b r b, b r b scenario', () => {
      it('should color 3 to white (and similarly in rotated scenarios)', () => {
        const board1 = [
          'red', 'blue', 'red',
          'blue', 'red', 'blue',
          'blue', 'red', 'blue'
        ]
        const moves = mockWhitenPiece();

        smartBotStrategy({ board: board1, ctx: makeCtx(), moves });

        expect([board1[3], board1[5]]).toContain('white');

        const board2 = [
          'red', 'blue', 'blue',
          'blue', 'red', 'red',
          'red', 'blue', 'blue'
        ]
        smartBotStrategy({ board: board2, ctx: makeCtx(), moves });
        expect([board2[7], board2[1]]).toContain('white');
      });

      it('should color 8 to white as 3rd if no instant win (and similarly in rotated scenarios)', () => {
        const moves = mockWhitenPiece();
        const board1 = [
          'red', 'blue', 'white',
          'white', 'red', 'blue',
          'blue', 'red', 'blue'
        ]
        smartBotStrategy({ board: board1, ctx: makeCtx(), moves });
        expect(board1[8]).toEqual('white');

        const board2 = [
          'red', 'blue', 'red',
          'white', 'red', 'blue',
          'blue', 'white', 'blue'
        ]
        smartBotStrategy({ board: board2, ctx: makeCtx(), moves });
        expect(board2[8]).toEqual('white');

        const board3 = [
          'blue', 'white', 'red',
          'white', 'red', 'blue',
          'blue', 'blue', 'red'
        ]
        smartBotStrategy({ board: board3, ctx: makeCtx(), moves })
        expect(board3[6]).toEqual('white');

        const board4 = [
          'blue', 'white', 'red',
          'red', 'red', 'blue',
          'blue', 'blue', 'white'
        ]
        smartBotStrategy({ board: board4, ctx: makeCtx(), moves })
        expect(board4[6]).toEqual('white');

        const board5 = [
          'blue', 'white', 'blue',
          'blue', 'red', 'white',
          'red', 'blue', 'red'
        ]
        smartBotStrategy({ board: board5, ctx: makeCtx(), moves })
        expect(board5[0]).toEqual('white');

        const board6 = [
          'blue', 'red', 'blue',
          'blue', 'red', 'white',
          'white', 'blue', 'red'
        ]
        smartBotStrategy({ board: board6, ctx: makeCtx(), moves })
        expect(board6[0]).toEqual('white');

        const board7 = [
          'red', 'blue', 'blue',
          'blue', 'red', 'white',
          'red', 'white', 'blue'
        ]
        smartBotStrategy({ board: board7, ctx: makeCtx(), moves })
        expect(board7[2]).toEqual('white');

        const board8 = [
          'white', 'blue', 'blue',
          'blue', 'red', 'red',
          'red', 'white', 'blue'
        ]
        smartBotStrategy({ board: board8, ctx: makeCtx(), moves })
        expect(board8[2]).toEqual('white');
      });
    });

    describe('r b b, b r r, b r b scenario', () => {
      it('should color 2 to white (and similarly in rotated scenarios)', () => {
        const board = [
          'red', 'blue', 'blue',
          'blue', 'red', 'red',
          'blue', 'red', 'blue'
        ]
        const moves = mockWhitenPiece();
        smartBotStrategy({ board, ctx: makeCtx(), moves })
        expect([board[2], board[6]]).toContain('white');
      });

      it('should color 3 to white (and similarly in rotated scenarios)', () => {
        const moves = mockWhitenPiece();
        const board1 = [
          'red', 'blue', 'white',
          'blue', 'red', 'red',
          'blue', 'white', 'blue'
        ]
        smartBotStrategy({ board: board1, ctx: makeCtx(), moves });
        expect(board1[3]).toEqual('white');

        const board2 = [
          'blue', 'blue', 'red',
          'white', 'red', 'blue',
          'blue', 'red', 'white'
        ]
        smartBotStrategy({ board: board2, ctx: makeCtx(), moves });
        expect(board2[1]).toEqual('white');

        const board3 = [
          'blue', 'white', 'blue',
          'red', 'red', 'blue',
          'white', 'blue', 'red'
        ]
        smartBotStrategy({ board: board3, ctx: makeCtx(), moves });
        expect(board3[5]).toEqual('white');

        const board4 = [
          'white', 'red', 'blue',
          'blue', 'red', 'white',
          'red', 'blue', 'blue'
        ]
        smartBotStrategy({ board: board4, ctx: makeCtx(), moves });
        expect(board4[7]).toEqual('white');
      });
    });
  });
});
