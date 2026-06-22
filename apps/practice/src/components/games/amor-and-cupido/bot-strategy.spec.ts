import { edgeIndex, generateStartBoard, type Board } from './helpers';
import { makeCtx } from '../../game-factory';
import { getBotScore, smartBotStrategy } from './bot-strategy';

describe('optimal solver (negamax)', () => {
  it('recognises an immediate winning position', () => {
    const board = generateStartBoard();
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 0;
    // Player 0 to move can close triangle {0,1,2}.
    expect(getBotScore(board, 0)).toBe(1);
  });
});

describe('smartBotStrategy', () => {
  it('blocks an immediate threat even from a losing position', () => {
    const board = generateStartBoard();
    // Opponent (player 0) owns two edges of triangle {0,1,2}; bot (player 1)
    // is to move and is losing, but must claim edge 1-2 to avoid losing now.
    board[edgeIndex[0][1]] = 0;
    board[edgeIndex[0][2]] = 0;
    let played: number | null = null;
    smartBotStrategy({
      board,
      ctx: makeCtx({ currentPlayer: 1 }),
      moves: { claimEdge: (b: Board, edge: number) => { played = edge; return { nextBoard: b }; } }
    });
    expect(played).toBe(edgeIndex[1][2]);
  });
});
