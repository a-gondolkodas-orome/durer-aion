import { botNextMoveArgs, makeCtx } from 'test-utils';
import { smartBotStrategy, randomBotStrategy, isWinningForPlayerToMove } from './bot-strategy';
import { getPossibleMoves, type Board, type Domino, type Field } from './gameplay';

const fieldKey = ({ row, col }: Field) => `${row},${col}`;

const captureMove = (board: Board, player: number, strategy: typeof smartBotStrategy): Domino =>
  botNextMoveArgs(strategy({ board, ctx: makeCtx({ currentPlayer: player }) }))[0] as Domino;

describe('isWinningForPlayerToMove', () => {
  it('the empty 4x4 board is a win for Árgyélus (the vertical player to move)', () => {
    // This is the whole point of the competition problem: the first player wins.
    expect(isWinningForPlayerToMove([], 0)).toBe(true);
  });

  it('the empty 4x4 board is a loss for the horizontal player to move', () => {
    // By symmetry (transpose the board) the position is symmetric between the two
    // orientations, so whoever moves first holds the advantage.
    expect(isWinningForPlayerToMove([], 1)).toBe(true);
  });

  it('a position with no legal move for the player to move is a loss', () => {
    // Fill the whole board; the vertical player has nowhere to go.
    const full: Board = [
      [{ row: 0, col: 0 }, { row: 0, col: 1 }], [{ row: 0, col: 2 }, { row: 0, col: 3 }],
      [{ row: 1, col: 0 }, { row: 1, col: 1 }], [{ row: 1, col: 2 }, { row: 1, col: 3 }],
      [{ row: 2, col: 0 }, { row: 2, col: 1 }], [{ row: 2, col: 2 }, { row: 2, col: 3 }],
      [{ row: 3, col: 0 }, { row: 3, col: 1 }], [{ row: 3, col: 2 }, { row: 3, col: 3 }]
    ];
    expect(isWinningForPlayerToMove(full, 0)).toBe(false);
  });
});

describe('smartBotStrategy', () => {
  it('places a domino of its own orientation (vertical for player 0)', () => {
    const placed = captureMove([], 0, smartBotStrategy);
    expect(placed[0].col).toBe(placed[1].col);
    expect(Math.abs(placed[0].row - placed[1].row)).toBe(1);
  });

  it('places a horizontal domino for player 1', () => {
    const placed = captureMove([], 1, smartBotStrategy);
    expect(placed[0].row).toBe(placed[1].row);
    expect(Math.abs(placed[0].col - placed[1].col)).toBe(1);
  });

  it('plays a move that keeps the win when the position is winning', () => {
    // Árgyélus to move on the empty board is winning; the chosen move must leave the
    // opponent (Félix) in a losing position.
    const placed = captureMove([], 0, smartBotStrategy);
    const boardAfter: Board = [placed];
    expect(isWinningForPlayerToMove(boardAfter, 1)).toBe(false);
  });

  it('grabs an immediate win: leaves the opponent no legal placement', () => {
    // Only two horizontal cells remain in the top row and the rest is full, so Félix
    // (player 1) can place there and then Árgyélus has no vertical move at all.
    const board: Board = [
      [{ row: 1, col: 0 }, { row: 1, col: 1 }], [{ row: 1, col: 2 }, { row: 1, col: 3 }],
      [{ row: 2, col: 0 }, { row: 2, col: 1 }], [{ row: 2, col: 2 }, { row: 2, col: 3 }],
      [{ row: 3, col: 0 }, { row: 3, col: 1 }], [{ row: 3, col: 2 }, { row: 3, col: 3 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }]
    ];
    const placed = captureMove(board, 1, smartBotStrategy);
    const boardAfter: Board = [...board, placed];
    expect(getPossibleMoves(boardAfter, 0)).toHaveLength(0);
  });
});

describe('randomBotStrategy', () => {
  it('always places a legal domino of its own orientation', () => {
    const placed = captureMove([], 1, randomBotStrategy);
    expect(placed[0].row).toBe(placed[1].row);
    expect(Math.abs(placed[0].col - placed[1].col)).toBe(1);
  });

  it('takes an immediate win when one is available', () => {
    const board: Board = [
      [{ row: 1, col: 0 }, { row: 1, col: 1 }], [{ row: 1, col: 2 }, { row: 1, col: 3 }],
      [{ row: 2, col: 0 }, { row: 2, col: 1 }], [{ row: 2, col: 2 }, { row: 2, col: 3 }],
      [{ row: 3, col: 0 }, { row: 3, col: 1 }], [{ row: 3, col: 2 }, { row: 3, col: 3 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }]
    ];
    // Only { (0,2),(0,3) } is left for Félix, and it removes Árgyélus's last option.
    const placed = captureMove(board, 1, randomBotStrategy);
    expect(new Set(placed.map(fieldKey)))
      .toEqual(new Set([fieldKey({ row: 0, col: 2 }), fieldKey({ row: 0, col: 3 })]));
  });
});
