import { useState } from 'react';
import { range, cloneDeep, isEqual, flatMap } from 'lodash';
import {
  strategyGameFactory,
  type Events, type BoardClientProps,
  GameBoard
} from '../../game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

export type Field = { row: number, col: number }
export type Domino = [Field, Field]
export type Board = Domino[]

export const BOARDSIZE = 6;
export const ALL_FIELDS: Field[] = flatMap(range(BOARDSIZE), row => range(BOARDSIZE).map(col => ({ row, col })));
const isCovered = (field: Field, board: Board) => flatMap(board).some(c => isEqual(c, field));

const getDominoDirection = (field: Field, board: Board) => {
  const domino = board.find(d => d.some(c => isEqual(c, field)))!;
  const neighbor = isEqual(domino[0], field) ? domino[1] : domino[0];
  if (field.row === neighbor.row) return field.col < neighbor.col ? 'left' : 'right';
  return field.row < neighbor.row ? 'top' : 'bottom';
};

// Each direction: all 4 borders except the opposite side, rounded on its own side.
const DOMINO_BORDER_CLASSES = {
  left:   'rounded-l-md border-t-4 border-b-4 border-l-4',
  right:  'rounded-r-md border-t-4 border-b-4 border-r-4',
  top:    'rounded-t-md border-t-4 border-l-4 border-r-4',
  bottom: 'rounded-b-md border-b-4 border-l-4 border-r-4'
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [hoveredField, setHoveredField] = useState<{ field: Field; moveCount: number } | null>(null);
  const validHoveredField = hoveredField?.moveCount === ctx.moveCount ? hoveredField.field : null;

  const hasEmptyNeighbor = ({ row, col }: Field) => {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dRow, dCol]) => {
      const neighbor = { row: row + dRow, col: col + dCol };
      if (neighbor.row < 0 || neighbor.row >= BOARDSIZE || neighbor.col < 0 || neighbor.col >= BOARDSIZE) return false;
      return !isCovered(neighbor, board);
    });
  };

  const clickField = (field: Field) => {
    if (selectedField === null) { setSelectedField(field); return; }
    if (isEqual(field, selectedField)) { setSelectedField(null); return; }
    moves.placeDomino(board, [selectedField, field]);
    setSelectedField(null);
  };

  const isNeighborOfSelected = ({ row, col }) => {
    if (selectedField === null) return false;
    return Math.abs(row - selectedField.row) + Math.abs(col - selectedField.col) === 1;
  }

  const isPartOfPreview = (field: Field) => {
    if (selectedField === null || validHoveredField === null) return false;
    if (!isNeighborOfSelected(validHoveredField) || isCovered(validHoveredField, board)) return false;
    return isEqual(field, selectedField) || isEqual(field, validHoveredField);
  };

  const getCellBgClass = (field: Field) => {
    if (isCovered(field, board)) return 'bg-slate-600 border-slate-900 dark:border-slate-400';
    if (!ctx.isClientMoveAllowed) return 'bg-surface-elevated';
    if (isPartOfPreview(field) || isEqual(selectedField, field)) return 'bg-blue-400';
    if (isNeighborOfSelected(field)) return 'bg-blue-100 dark:bg-blue-900';
    return 'bg-surface-elevated';
  };

  const isClickAllowed = (field: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (isCovered(field, board)) return false;
    if (!hasEmptyNeighbor(field)) return false;
    if (selectedField !== null && isEqual(field, selectedField)) return true;
    if (selectedField !== null && !isNeighborOfSelected(field)) return false;
    return true;
  }

  const getDominoBorders = (field: Field) => {
    if (!isCovered(field, board)) return '';
    return DOMINO_BORDER_CLASSES[getDominoDirection(field, board)];
  }

  return (
  <GameBoard>
    <table className="w-full border-collapse table-fixed">
      <tbody>
        {range(BOARDSIZE).map(row => (
          <tr key={row}>
            {range(BOARDSIZE).map(col => {
              const field: Field = { row, col };
              return (
              <td
                key={col}
                className="border-4 dark:border-slate-600"
              >
                <button
                  className={`
                    aspect-square w-full p-[5%] relative
                    ${getCellBgClass(field)}
                    ${getDominoBorders(field)}
                  `}
                  disabled={!isClickAllowed(field)}
                  onClick={() => clickField(field)}
                  onPointerEnter={() => setHoveredField({ field, moveCount: ctx.moveCount })}
                  onPointerMove={() => setHoveredField({ field, moveCount: ctx.moveCount })}
                  onPointerLeave={() => setHoveredField(null)}
                  onFocus={() => setHoveredField({ field, moveCount: ctx.moveCount })}
                  onBlur={() => setHoveredField(null)}
                >
                  {isCovered(field, board) && <>
                    <span className={`
                      aspect-square rounded-full bg-yellow-400 inline-block
                      absolute z-20 left-[40%] right-[40%] bottom-[40%]
                    `} />
                    {getDominoDirection(field, board) === 'left' && (
                      <span className={
                        'absolute right-0 top-0 bottom-0 w-1.5 bg-yellow-400 z-10 translate-x-full'
                      } />
                    )}
                    {getDominoDirection(field, board) === 'top' && (
                      <span className={
                        'absolute bottom-0 left-0 right-0 h-1.5 bg-yellow-400 z-10 translate-y-full'
                      } />
                    )}
                  </>}
                </button>
              </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </GameBoard>
  );
};

export const getPossibleMoves = (board: Board) => {
  const possibleMoves: Board = [];
  ALL_FIELDS.forEach(({ row, col }) => {
    if (isCovered({ row, col }, board)) return;
    if (col < (BOARDSIZE - 1) && !isCovered({ row, col: col + 1 }, board)) {
      possibleMoves.push([{ row, col }, { row, col: col + 1 }])
    };
    if (row < (BOARDSIZE - 1) && !isCovered({ row: row + 1, col }, board)) {
      possibleMoves.push([{ row, col }, { row: row + 1, col }])
    };
  });

  return possibleMoves;
}

const moves = {
  placeDomino: (board: Board, { events }: { events: Events }, domino: Domino) => {
    const nextBoard = cloneDeep(board);
    nextBoard.push(domino);
    events.endTurn();
    if (getPossibleMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const toldalek = {
  '4': 'e',
  '6': 'o',
  '8': 'a'
}

const rule = {
  hu: <>
    Két játékos felváltva tesz egy-egy dominót egy {BOARDSIZE} × {BOARDSIZE}-{toldalek[BOARDSIZE]}s
    sakktáblára úgy, hogy két élszomszédos üres mezőt fedjen le. Az veszít aki nem tud tenni.
  </>,
  en: <>
    Two players take turns placing a domino on a {BOARDSIZE} × {BOARDSIZE} chessboard so that it
    covers two adjacent empty squares. The player who cannot place a domino loses.
  </>
};

export const DominoesOnChessboard = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy üres mezőre, majd egy szomszédjára, hogy lehelyezz egy dominót.',
      en: 'Click an empty square, then a neighbour of it, to place a domino.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => [],
      label: { hu: 'Okos 🤖', en: 'Smart 🤖' },
      isDefault: true,
      notAlwaysOptimal: true
    }
  ]
});
