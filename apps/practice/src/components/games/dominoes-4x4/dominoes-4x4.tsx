import { useState } from 'react';
import { range, cloneDeep, isEqual, flatMap } from 'lodash';
import {
  strategyGameFactory,
  type MoveOutcome, type Ctx, type BoardClientProps,
  GameBoard, useHoverPreview
} from '../../strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

export type Field = { row: number, col: number }
export type Domino = [Field, Field]
export type Board = Domino[]

export const BOARDSIZE = 4;
const ALL_FIELDS: Field[] = flatMap(range(BOARDSIZE), row => range(BOARDSIZE).map(col => ({ row, col })));
const isCovered = (field: Field, board: Board) => flatMap(board).some(c => isEqual(c, field));

const isVerticalDomino = ([a, b]: Domino) => a.col === b.col;

// Player 0 (Árgyélus) places vertical dominoes; player 1 (Félix) horizontal ones.
export const getPossibleMoves = (board: Board, player: number): Board => {
  const possibleMoves: Board = [];
  const [dRow, dCol] = player === 0 ? [1, 0] : [0, 1];
  ALL_FIELDS.forEach(({ row, col }) => {
    const neighbor = { row: row + dRow, col: col + dCol };
    if (neighbor.row >= BOARDSIZE || neighbor.col >= BOARDSIZE) return;
    if (isCovered({ row, col }, board) || isCovered(neighbor, board)) return;
    possibleMoves.push([{ row, col }, neighbor]);
  });
  return possibleMoves;
};

// A domino is legal when it covers two uncovered fields along the current
// player's own axis, which is what `getPossibleMoves` enumerates for them. The
// player picks the two fields in either order, so the pair is matched unordered.
export const isDominoAllowed = (board: Board, player: number, domino: Domino): boolean =>
  Array.isArray(domino) && domino.length === 2
    && getPossibleMoves(board, player)
      .some(m => isEqual(m, domino) || isEqual(m, [domino[1], domino[0]]));

const getDominoDirection = (field: Field, board: Board) => {
  const domino = board.find(d => d.some(c => isEqual(c, field)))!;
  const neighbor = isEqual(domino[0], field) ? domino[1] : domino[0];
  if (field.row === neighbor.row) return field.col < neighbor.col ? 'left' : 'right';
  return field.row < neighbor.row ? 'top' : 'bottom';
};

// Each direction: all 4 borders except the shared side, rounded on its own outer side.
const DOMINO_BORDER_CLASSES = {
  left:   'rounded-l-md border-t-4 border-b-4 border-l-4',
  right:  'rounded-r-md border-t-4 border-b-4 border-r-4',
  top:    'rounded-t-md border-t-4 border-l-4 border-r-4',
  bottom: 'rounded-b-md border-b-4 border-l-4 border-r-4'
};

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const { value: validHoveredField, hoverProps } = useHoverPreview<Field>(ctx.moveCount);

  // The direction the current player extends a domino: vertical for Árgyélus (player 0),
  // horizontal for Félix (player 1).
  const step = ctx.currentPlayer === 0 ? { dRow: 1, dCol: 0 } : { dRow: 0, dCol: 1 };

  // The field would complete a legal domino with the one already selected.
  const isValidPartner = (field: Field) =>
    selectedField !== null && moves.placeDomino.isAllowed!(board, [selectedField, field]);

  const hasPlaceablePartner = ({ row, col }: Field) => {
    return [[step.dRow, step.dCol], [-step.dRow, -step.dCol]].some(([dRow, dCol]) => {
      const neighbor = { row: row + dRow, col: col + dCol };
      if (neighbor.row < 0 || neighbor.row >= BOARDSIZE || neighbor.col < 0 || neighbor.col >= BOARDSIZE) return false;
      return !isCovered(neighbor, board);
    });
  };

  // A rejected click must leave the local selection alone, so this keeps a guard
  // rather than relying on the engine silently ignoring the dispatch.
  const clickField = (field: Field) => {
    if (!isClickAllowed(field)) return;
    if (selectedField === null) { setSelectedField(field); return; }
    if (isEqual(field, selectedField)) { setSelectedField(null); return; }
    moves.placeDomino(board, [selectedField, field]);
    setSelectedField(null);
  };

  const isPartOfPreview = (field: Field) => {
    if (selectedField === null || validHoveredField === null) return false;
    if (!isValidPartner(validHoveredField)) return false;
    return isEqual(field, selectedField) || isEqual(field, validHoveredField);
  };

  const getCellBgClass = (field: Field) => {
    if (isCovered(field, board)) {
      const domino = board.find(d => d.some(c => isEqual(c, field)))!;
      return isVerticalDomino(domino)
        ? 'bg-blue-500 border-blue-800 dark:border-blue-300'
        : 'bg-amber-500 border-amber-800 dark:border-amber-300';
    }
    if (!ctx.isClientMoveAllowed) return 'bg-surface-elevated';
    // Preview tint matches the colour of the domino the current player will place:
    // blue for Árgyélus (vertical), amber for Félix (horizontal).
    const preview = ctx.currentPlayer === 0
      ? { strong: 'bg-blue-400', soft: 'bg-blue-100 dark:bg-blue-900' }
      : { strong: 'bg-amber-400', soft: 'bg-amber-100 dark:bg-amber-900' };
    if (isPartOfPreview(field) || isEqual(selectedField, field)) return preview.strong;
    if (isValidPartner(field)) return preview.soft;
    return 'bg-surface-elevated';
  };

  const isClickAllowed = (field: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (isCovered(field, board)) return false;
    // clicking the selected field again deselects it
    if (selectedField !== null && isEqual(field, selectedField)) return true;
    // the second click has to complete a domino the engine would accept
    if (selectedField !== null) return isValidPartner(field);
    return hasPlaceablePartner(field);
  };

  const getDominoBorders = (field: Field) => {
    if (!isCovered(field, board)) return '';
    return DOMINO_BORDER_CLASSES[getDominoDirection(field, board)];
  };

  return (
  <GameBoard>
    <table className="w-full border-collapse table-fixed max-w-md mx-auto">
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
                  {...hoverProps(field)}
                >
                  {isCovered(field, board) && (
                    <span className="absolute inset-[38%] rounded-full bg-white/90 z-20" />
                  )}
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

const moves = {
  placeDomino: {
    validate: (board: Board, { ctx }: { ctx: Ctx }, domino: Domino) =>
      isDominoAllowed(board, ctx.currentPlayer!, domino),
    apply: (board: Board, { ctx }: { ctx: Ctx }, domino: Domino): MoveOutcome<Board> => {
      const nextBoard = cloneDeep(board);
      nextBoard.push(domino);
      const nextPlayer = 1 - ctx.currentPlayer!;
      if (getPossibleMoves(nextBoard, nextPlayer).length === 0) {
        return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, isTurnEnd: true };
    }
  }
};

const rule = {
  hu: <>
    Árgyélus és Félix felváltva pakolnak 1 × 2-es dominókat egy 4 × 4-es táblára. Árgyélus mindig
    álló, Félix mindig fekvő dominókat rak. Árgyélus kezd, és az veszít, aki már nem tud rakni.
  </>,
  en: <>
    Vera and Harry take turns placing 1 × 2 dominoes on a 4 × 4 board. Vera always places
    vertical dominoes, Harry always horizontal ones. Vera goes first, and whoever cannot place
    a domino loses.
  </>
};

const getPlayerStepDescription = ({ ctx }: { ctx: Ctx }) => {
  if (ctx.currentPlayer === 0) {
    return {
      hu: 'Kattints egy mezőre, majd a fölötte vagy alatta lévő üres mezőre álló dominóért.',
      en: 'Click a square, then the empty square above or below it, to place a vertical domino.'
    };
  }
  return {
    hu: 'Kattints egy mezőre, majd a mellette lévő üres mezőre, hogy fekvő dominót tegyél le.',
    en: 'Click a square, then the empty square next to it, to place a horizontal domino.'
  };
};

export const Dominoes4x4 = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Árgyélus (álló)', en: 'Vera (vertical)' },
      { hu: 'Félix (fekvő)', en: 'Harry (horizontal)' }
    ],
    getPlayerStepDescription
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt', en: 'Test' } },
    {
      botStrategy: smartBotStrategy,
      generateStartBoard: () => [],
      label: { hu: 'Teljes', en: 'Full' },
      isDefault: true
    }
  ]
});
