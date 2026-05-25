import { smartBotStrategy } from "./bot-strategy";
import type { Board } from './helpers';
import { makeCtx, type GameMoves } from '../../../game-factory';

const mockPlacePiece = (): GameMoves<Board> => ({
  placePiece: (board: Board, id: number) => { board[id] = 'new_piece'; return { nextBoard: board }; }
});

describe('smartBotStrategy', () => {
  it('should place to middle place as a starting move', () => {
    const board = Array(9).fill(null);
    const moves = mockPlacePiece();

    smartBotStrategy({ board, moves, ctx: makeCtx({ chosenRoleIndex: 1 }) });

    expect(board[4]).toEqual('new_piece');
  });

  it('should place to central mirror image of item without mirror image', () => {
    const moves = mockPlacePiece();
    const board1 = [
      'blue', null, null,
      null, 'red', null,
      null, null, null
    ]
    smartBotStrategy({ board: board1, moves, ctx: makeCtx({ chosenRoleIndex: 1 }) })
    expect(board1[8]).toEqual('new_piece');

    const board2 = [
      'blue', null, null,
      null, 'red', 'blue',
      null, null, 'red'
    ]
    smartBotStrategy({ board: board2, moves, ctx: makeCtx({ chosenRoleIndex: 1 }) })

    expect(board2[3]).toEqual('new_piece');
  });

  it('should not place to achieve 3 in a row if possible', () => {
    const board = [
      'blue', null, 'blue',
      'blue', 'red', 'red',
      'red', null, 'red'
    ];
    const moves = mockPlacePiece();
    smartBotStrategy({ board, moves, ctx: makeCtx({ chosenRoleIndex: 0 }) })
    expect(board[1]).not.toEqual('new_piece');
  });
});
