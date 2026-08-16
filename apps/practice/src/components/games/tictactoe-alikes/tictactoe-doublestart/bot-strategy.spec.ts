import { smartBotStrategy } from './bot-strategy';
import { botNextMoveArgs, makeCtx } from 'test-utils';

describe('Double starter TicTacToe strategy', () => {
  describe('AI is the first to move', () => {
    it('should place to middle field as a second move', () => {
      const board = [
        'red', 'blue', 'red',
        null, null, null,
        null, null, null
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 1 }) }));
      expect(played).toContain(4);
    });

    it('should place to finish a winning diagonal if possible', () => {
      const board = [
        'red', 'blue', 'red',
        null, 'red', null,
        null, null, 'blue'
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 1 }) }));
      expect(played).toContain(6);
    });

    it('should place to defend against 3 pieces in a row from other player', () => {
      const board = [
        'red', 'red', 'red',
        null, null, null,
        null, 'blue', 'blue'
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 1 }) }));
      expect(played).toContain(6);
    });
  });

  describe('AI is the second to move', () => {
    it('should place third blue piece in a row if possible', () => {
      const board = [
        'red', 'red', 'red',
        null, null, 'red',
        null, 'blue', 'blue'
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 0 }) }));
      expect(played).toContain(6);
    });

    it('should try to create a blue row', () => {
      const board = [
        'red', 'red', 'blue',
        null, 'red', null,
        null, null, null
      ];
      const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 0 }) }));
      expect(played).toContain(8);
    });
  });
});
