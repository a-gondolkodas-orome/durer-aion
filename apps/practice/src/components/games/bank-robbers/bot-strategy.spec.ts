import { aiBotStrategy } from "./bot-strategy";
import type { Board } from './bank-robbers';
import type { GameMoves } from '../../game-factory/types';
import { makeCtx } from '../../game-factory/ctx-factory';

const mockRob = (): GameMoves<Board> => ({
  rob: (board: Board, bank: number) => { board.circle[bank] = false; return { nextBoard: board }; }
});

describe('aiBotStrategy', () => {
  it('moves symmetrically for even number of banks', () => {
    const board: Board = {
      circle: [false, true, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    aiBotStrategy({ board, ctx: makeCtx(), moves: mockRob() });
    expect(board.circle[4]).toBe(false);
  });

  it('robs bank with 1 gap as second for 7 banks', () => {
    const board: Board = {
      circle: [false, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    aiBotStrategy({ board, ctx: makeCtx(), moves: mockRob() });
    expect(board.circle[2] === false || board.circle[5] === false).toBe(true);
  });

  it('robs bank with 2 gap as second for 9 banks', () => {
    const board: Board = {
      circle: [false, true, true, true, true, true, true, true, true],
      firstMove: 5,
      lastMove: 0
    }
    aiBotStrategy({ board, ctx: makeCtx(), moves: mockRob() });
    expect(board.circle[3] === false || board.circle[6] === false).toBe(true);
  });
});
