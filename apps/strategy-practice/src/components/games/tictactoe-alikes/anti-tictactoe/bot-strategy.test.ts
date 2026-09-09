import { smartBotStrategy } from './bot-strategy';
import { botNextMoveArgs, makeCtx } from 'test-utils';

describe('smartBotStrategy', () => {
  it('should place to middle place as a starting move', () => {
    const board = Array(9).fill(null);
    const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 1 }) }));

    expect(played).toContain(4);
  });

  it('should place to central mirror image of item without mirror image', () => {
    const board1 = [
      'blue', null, null,
      null, 'red', null,
      null, null, null
    ]
    const played1 = botNextMoveArgs(smartBotStrategy({ board: board1, ctx: makeCtx({ chosenRoleIndex: 1 }) }));
    expect(played1).toContain(8);

    const board2 = [
      'blue', null, null,
      null, 'red', 'blue',
      null, null, 'red'
    ]
    const played2 = botNextMoveArgs(smartBotStrategy({ board: board2, ctx: makeCtx({ chosenRoleIndex: 1 }) }));

    expect(played2).toContain(3);
  });

  it('should not place to achieve 3 in a row if possible', () => {
    const board = [
      'blue', null, 'blue',
      'blue', 'red', 'red',
      'red', null, 'red'
    ];
    const played = botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ chosenRoleIndex: 0 }) }));
    expect(played).not.toContain(1);
  });
});
