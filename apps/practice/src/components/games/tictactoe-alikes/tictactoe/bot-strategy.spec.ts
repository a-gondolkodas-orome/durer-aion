import { smartBotStrategy } from './bot-strategy';
import { botNextMoveArgs, makeCtx } from 'test-utils';

describe('smartBotStrategy', () => {
  describe('new piece placing phase', () => {
    it('should win the game in 1 move if possible', () => {
      const board = [
        'red', 'red', null,
        null, null, null,
        'blue', 'blue', null
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect(played).toContain(2);
    });

    it('should win the game in 1 move if possible for 0th place as well', () => {
      const board = [
        null, 'red', 'red',
        null, null, null,
        'blue', 'blue', null
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect(played).toContain(0);
    });

    it('should identify a diagonal winning position', () => {
      const board = [
        'blue', 'blue', 'red',
        null, 'red', null,
        null, null, 'blue'
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect(played).toContain(6);
    });

    it('should place to player winning place', () => {
      const board = [
        'blue', 'blue', 'red',
        'blue', null, null,
        null, 'red', null
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect(played).toContain(6);
    });

    it('should place to middle place if still empty', () => {
      const board = [
        'blue', null, null,
        null, null, null,
        null, null, null
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect(played).toContain(4);
    });

    it('should place to corner if middle is not empty', () => {
      const board = [
        null, null, null,
        null, 'blue', null,
        null, null, null
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect([0, 2, 6, 8]).toContain(played[0]);
    });

    it('should place to defending corner if 1 diagonal is occupied', () => {
      const board = [
        'red', null, null,
        null, 'blue', null,
        null, null, 'blue'
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect([2, 6]).toContain(played[0]);
    });
  });

  describe('board is already full phase', () => {
    it('should color middle field to white if allowed', () => {
      const board = [
        'red', 'blue', 'red',
        'red', 'blue', 'blue',
        'blue', 'red', 'blue'
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect(played).toContain(4);
    });

    it('should win the game in one move is possible', () => {
      const board = [
        'red', 'blue', 'red',
        'white', 'white', 'blue',
        'blue', 'red', 'blue'
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));

      expect(played).toContain(5);
    });

    describe('r b r, b r b, b r b scenario', () => {
      it('should color 3 to white (and similarly in rotated scenarios)', () => {
        const board1 = [
          'red', 'blue', 'red',
          'blue', 'red', 'blue',
          'blue', 'red', 'blue'
        ]
        const played1 = botNextMoveArgs(smartBotStrategy({ board: board1, ctx: makeCtx() }));

        expect([3, 5]).toContain(played1[0]);

        const board2 = [
          'red', 'blue', 'blue',
          'blue', 'red', 'red',
          'red', 'blue', 'blue'
        ]
        const played2 = botNextMoveArgs(smartBotStrategy({ board: board2, ctx: makeCtx() }));
        expect([7, 1]).toContain(played2[0]);
      });

      it('should color 8 to white as 3rd if no instant win (and similarly in rotated scenarios)', () => {
        const board1 = [
          'red', 'blue', 'white',
          'white', 'red', 'blue',
          'blue', 'red', 'blue'
        ]
        const played1 = botNextMoveArgs(smartBotStrategy({ board: board1, ctx: makeCtx() }));
        expect(played1).toContain(8);

        const board2 = [
          'red', 'blue', 'red',
          'white', 'red', 'blue',
          'blue', 'white', 'blue'
        ]
        const played2 = botNextMoveArgs(smartBotStrategy({ board: board2, ctx: makeCtx() }));
        expect(played2).toContain(8);

        const board3 = [
          'blue', 'white', 'red',
          'white', 'red', 'blue',
          'blue', 'blue', 'red'
        ]
        const played3 = botNextMoveArgs(smartBotStrategy({ board: board3, ctx: makeCtx() }));
        expect(played3).toContain(6);

        const board4 = [
          'blue', 'white', 'red',
          'red', 'red', 'blue',
          'blue', 'blue', 'white'
        ]
        const played4 = botNextMoveArgs(smartBotStrategy({ board: board4, ctx: makeCtx() }));
        expect(played4).toContain(6);

        const board5 = [
          'blue', 'white', 'blue',
          'blue', 'red', 'white',
          'red', 'blue', 'red'
        ]
        const played5 = botNextMoveArgs(smartBotStrategy({ board: board5, ctx: makeCtx() }));
        expect(played5).toContain(0);

        const board6 = [
          'blue', 'red', 'blue',
          'blue', 'red', 'white',
          'white', 'blue', 'red'
        ]
        const played6 = botNextMoveArgs(smartBotStrategy({ board: board6, ctx: makeCtx() }));
        expect(played6).toContain(0);

        const board7 = [
          'red', 'blue', 'blue',
          'blue', 'red', 'white',
          'red', 'white', 'blue'
        ]
        const played7 = botNextMoveArgs(smartBotStrategy({ board: board7, ctx: makeCtx() }));
        expect(played7).toContain(2);

        const board8 = [
          'white', 'blue', 'blue',
          'blue', 'red', 'red',
          'red', 'white', 'blue'
        ]
        const played8 = botNextMoveArgs(smartBotStrategy({ board: board8, ctx: makeCtx() }));
        expect(played8).toContain(2);
      });
    });

    describe('r b b, b r r, b r b scenario', () => {
      it('should color 2 to white (and similarly in rotated scenarios)', () => {
        const board = [
          'red', 'blue', 'blue',
          'blue', 'red', 'red',
          'blue', 'red', 'blue'
        ]
        const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }));
        expect([2, 6]).toContain(played[0]);
      });

      it('should color 3 to white (and similarly in rotated scenarios)', () => {
        const board1 = [
          'red', 'blue', 'white',
          'blue', 'red', 'red',
          'blue', 'white', 'blue'
        ]
        const played1 = botNextMoveArgs(smartBotStrategy({ board: board1, ctx: makeCtx() }));
        expect(played1).toContain(3);

        const board2 = [
          'blue', 'blue', 'red',
          'white', 'red', 'blue',
          'blue', 'red', 'white'
        ]
        const played2 = botNextMoveArgs(smartBotStrategy({ board: board2, ctx: makeCtx() }));
        expect(played2).toContain(1);

        const board3 = [
          'blue', 'white', 'blue',
          'red', 'red', 'blue',
          'white', 'blue', 'red'
        ]
        const played3 = botNextMoveArgs(smartBotStrategy({ board: board3, ctx: makeCtx() }));
        expect(played3).toContain(5);

        const board4 = [
          'white', 'red', 'blue',
          'blue', 'red', 'white',
          'red', 'blue', 'blue'
        ]
        const played4 = botNextMoveArgs(smartBotStrategy({ board: board4, ctx: makeCtx() }));
        expect(played4).toContain(7);
      });
    });
  });
});
