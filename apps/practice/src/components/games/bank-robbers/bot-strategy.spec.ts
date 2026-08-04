import { smartBotStrategy } from "./bot-strategy";
import type { Board } from './gameplay';
import { botNextMoveArgs, makeCtx } from '../../../test-utils';

const robbedBank = (board: Board): number => botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }))[0];

describe('smartBotStrategy', () => {
  it('moves symmetrically for even number of banks', () => {
    const board: Board = {
      circle: [false, true, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    expect(robbedBank(board)).toBe(4);
  });

  it('robs bank with 1 gap as second for 7 banks', () => {
    const board: Board = {
      circle: [false, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    expect([2, 5]).toContain(robbedBank(board));
  });

  it('robs bank with 2 gap as second for 9 banks', () => {
    const board: Board = {
      circle: [false, true, true, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    expect([3, 6]).toContain(robbedBank(board));
  });
});
