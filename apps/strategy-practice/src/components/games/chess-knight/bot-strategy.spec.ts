import { range, uniq } from 'lodash';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import {
  generateStartBoard, getAllowedMoves, moves, type Board, type CellValue, type Field
} from './gameplay';
import { botNextMoveArgs, makeCtx, moveValidator } from 'test-utils';

const boardWith = (knightPosition: Field, visited: number[][] = []): Board => {
  const chessBoard: CellValue[][] = range(4).map(() => range(4).map((): CellValue => null));
  visited.forEach(([row, col]) => { chessBoard[row][col] = 'visited'; });
  chessBoard[knightPosition.row][knightPosition.col] = 'knight';
  return { chessBoard, knightPosition };
};

const isKnightMoveAllowed = moveValidator(moves.moveKnight);

const fieldNamed = (board: Board): Field =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx() }))[0];

const CORNERS: Field[] = [
  { row: 0, col: 0 }, { row: 0, col: 3 }, { row: 3, col: 0 }, { row: 3, col: 3 }
];

// The 4x4 board splits into three orbits under knight moves: the four corners,
// the four centre squares, and the eight edge middles. The bot's whole
// strategy is stated in those terms, so the spec is too.
const isCentre = ({ row, col }: Field) => row >= 1 && row <= 2 && col >= 1 && col <= 2;
const isCorner = (field: Field) => CORNERS.some(c => c.row === field.row && c.col === field.col);
const isEdgeMiddle = (field: Field) => !isCentre(field) && !isCorner(field);

describe('smartBotStrategy', () => {
  it('takes the only move it has left', () => {
    // The corner (0,0) reaches (1,2) and (2,1); with one of them toured there
    // is no choice to make.
    expect(fieldNamed(boardWith({ row: 0, col: 0 }, [[2, 1]]))).toEqual({ row: 1, col: 2 });
  });

  it('leaves a centre square for a corner', () => {
    const board = boardWith({ row: 1, col: 1 });
    expect(getAllowedMoves(board)).toHaveLength(4);
    expect(isCorner(fieldNamed(board))).toBe(true);
  });

  it('stays on the edge-middle orbit from an edge middle', () => {
    // From (0,1) the knight can reach a centre square, and the bot must not.
    const board = boardWith({ row: 0, col: 1 });
    expect(getAllowedMoves(board)).toContainEqual({ row: 2, col: 2 });
    expect(isEdgeMiddle(fieldNamed(board))).toBe(true);
  });

  it('falls back to a free choice from a centre square with every corner toured', () => {
    const board = boardWith({ row: 1, col: 1 }, [[0, 3], [3, 0]]);
    const seen = uniq(range(40).map(() => JSON.stringify(fieldNamed(board))));

    expect(seen.map(field => JSON.parse(field)).sort((a, b) => a.row - b.row))
      .toEqual([{ row: 2, col: 3 }, { row: 3, col: 2 }]);
  });

  it('falls back to a free choice from a corner, which neither rule covers', () => {
    const board = boardWith({ row: 0, col: 0 });
    const seen = uniq(range(40).map(() => JSON.stringify(fieldNamed(board))));

    expect(seen.map(field => JSON.parse(field)).sort((a, b) => a.row - b.row))
      .toEqual([{ row: 1, col: 2 }, { row: 2, col: 1 }]);
  });

  it('only ever names a square the knight may actually jump to', () => {
    // Both fallbacks draw at random, so one call per board proves little.
    const boards = [
      ...range(20).map(() => generateStartBoard()),
      boardWith({ row: 1, col: 1 }),
      boardWith({ row: 0, col: 1 }),
      boardWith({ row: 0, col: 0 }),
      boardWith({ row: 1, col: 1 }, [[0, 3], [3, 0]]),
      boardWith({ row: 2, col: 2 }, [[0, 1], [1, 0]])
    ];

    const illegal = boards.flatMap(board =>
      range(20)
        .map(() => fieldNamed(board))
        .filter(field => !isKnightMoveAllowed(board, field))
        .map(field => `${JSON.stringify(board.knightPosition)} -> ${JSON.stringify(field)}`));

    expect(uniq(illegal)).toEqual([]);
  });
});

describe('randomBotStrategy', () => {
  it('draws only from the allowed jumps, and reaches all of them', () => {
    const board = boardWith({ row: 1, col: 1 });
    const seen = uniq(range(60).map(() =>
      JSON.stringify(botNextMoveArgs(randomBotStrategy({ board, ctx: makeCtx() }))[0])));

    expect(seen.map(field => JSON.parse(field)).sort((a, b) => a.row - b.row || a.col - b.col))
      .toEqual(getAllowedMoves(board).sort((a, b) => a.row - b.row || a.col - b.col));
  });
});
