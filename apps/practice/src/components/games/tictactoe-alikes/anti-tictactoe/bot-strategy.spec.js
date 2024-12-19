import { aiBotStrategy } from "./bot-strategy";

describe('aiBotStrategy', () => {
  it('should place to middle place as a starting move', () => {
    const board = Array(9).fill(null);
    const moves = { placePiece: (board, id) => board[id] = 'new_piece' }

    aiBotStrategy({ board, moves, ctx: { chosenRoleIndex: 1 } });

    expect(board[4]).toEqual('new_piece');
  });

  it('should place to central mirror image of item without mirror image', () => {
    const moves = { placePiece: (board, id) => board[id] = 'new_piece' }
    const board1 = [
      'blue', null, null,
      null, 'red', null,
      null, null, null
    ]
    aiBotStrategy({ board: board1, moves, ctx: { chosenRoleIndex: 1 } })
    expect(board1[8]).toEqual('new_piece');

    const board2 = [
      'blue', null, null,
      null, 'red', 'blue',
      null, null, 'red'
    ]
    aiBotStrategy({ board: board2, moves, ctx: { chosenRoleIndex: 1 } })

    expect(board2[3]).toEqual('new_piece');
  });

  it('should not place to achieve 3 in a row if possible', () => {
    const board = [
      'blue', null, 'blue',
      'blue', 'red', 'red',
      'red', null, 'red'
    ];
    const moves = { placePiece: (board, id) => board[id] = 'new_piece' }
    aiBotStrategy({ board, moves, ctx: { chosenRoleIndex: 0 } })
    expect(board[1]).not.toEqual('new_piece');
  });
});
