import { cloneDeep } from 'lodash';
import { edgeIndex, startBoard } from './gameplay';
import { makeCtx } from 'test-utils';
import { getBotScore, smartBotStrategy } from './bot-strategy';

describe('optimal solver (negamax)', () => {
  it('recognises an immediate winning position', () => {
    const board = cloneDeep(startBoard);
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 0;
    // Player 0 to move can close triangle {0,1,2}.
    expect(getBotScore(board, 0)).toBe(1);
  });
});

describe('smartBotStrategy', () => {
  it('blocks an immediate threat even from a losing position', () => {
    const board = cloneDeep(startBoard);
    // Opponent (player 0) owns two edges of triangle {0,1,2}; bot (player 1)
    // is to move and is losing, but must claim edge 1-2 to avoid losing now.
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 0;
    expect(smartBotStrategy({ board, ctx: makeCtx({ currentPlayer: 1 }) }))
      .toEqual({ move: 'claimEdge', args: [edgeIndex[1][2]] });
  });
});
