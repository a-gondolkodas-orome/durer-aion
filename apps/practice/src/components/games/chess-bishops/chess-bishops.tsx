import { useState } from 'react';
import { range, isEqual, some, cloneDeep } from 'lodash';
import { strategyGameFactory, type BoardClientProps, type Events, GameBoard } from '../../game-factory';
import { ChessBishopSvg } from './chess-bishop-svg';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  generateStartBoard, getAllowedMoves, BISHOP, FORBIDDEN, markForbiddenFields,
  type Board, type Field
} from './helpers';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [hoveredField, setHoveredField] = useState<Field | null>(null);
  const clickField = (field: Field) => {
    if (!isMoveAllowed(field)) return;

    moves.placeBishop(board, field);
  };

  const isPotentialNextStep = (field: Field) => {
    if (!isMoveAllowed(field)) return false;
    if (!hoveredField) return false;
    return isEqual(hoveredField, field);
  };
  const isMoveAllowed = (targetField: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };
  const isForbidden = ({ row, col }: Field) => {
    return board[row][col] === FORBIDDEN;
  };
  const isBishop = ({ row, col }: Field) => {
    return board[row][col] === BISHOP;
  };
  const wouldBeForbidden = ({ row, col }: Field) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (!hoveredField) return false;
    if (!isMoveAllowed(hoveredField)) return false;
    if (!isMoveAllowed({ row, col })) return false;
    if (isPotentialNextStep({ row, col })) return false;
    return Math.abs(row - hoveredField.row) === Math.abs(col - hoveredField.col);
  };

  return (
  <GameBoard>
    <ChessBishopSvg />
    <table className="w-full border-collapse table-fixed">
      <tbody>
        {range(8).map(row => (
          <tr key={row}>
            {range(8).map(col => (
              <td
                key={col}
                className={`
                  border-4 ${isForbidden({ row, col }) ? 'bg-slate-400' : ''}
                  ${wouldBeForbidden({ row, col }) ? 'bg-slate-300' : ''}
                `}
              >
                <button
                  className="aspect-square w-full"
                  disabled={!isMoveAllowed({ row, col })}
                  onClick={() => clickField({ row, col })}
                  onMouseOver={() => setHoveredField({ row, col })}
                  onMouseOut={() => setHoveredField(null)}
                  onFocus={() => setHoveredField({ row, col })}
                  onBlur={() => setHoveredField(null)}
                >
                  {isBishop({ row, col }) && (
                    <svg className="inline-block aspect-square">
                      <use xlinkHref="#game-chess-bishop" />
                    </svg>
                  )}
                  {isPotentialNextStep({ row, col }) && (
                    <svg className="inline-block aspect-square opacity-50">
                      <use xlinkHref="#game-chess-bishop" />
                    </svg>
                  )}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </GameBoard>
  );
};

const moves = {
  placeBishop: (board: Board, { events }: { events: Events }, { row, col }: Field) => {
    const nextBoard = cloneDeep(board);
    markForbiddenFields(nextBoard, { row, col });
    nextBoard[row][col] = BISHOP;
    events.endTurn();
    if (getAllowedMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Két játékos felváltva tesz le a sakktáblára futókat. Egy új futót mindig
    csak olyan mezőre tehetünk, amin még nem áll futó, és azt a mezőt nem is támadja futó. Az
    veszít, aki nem tud lerakni futót.
  </>,
  en: <>
    Two players take turns placing bishops on a chessboard. A new bishop may only be placed on a
    square that is not already occupied by a bishop and is not attacked by any bishop. The player
    who cannot place a bishop loses.
  </>
};

export const ChessBishops = strategyGameFactory({
  presentation: {
    rule,
    getPlayerStepDescription: () => ({
      hu: 'Kattints egy mezőre, amit nem üt egyik futó sem.',
      en: 'Click on a square that is not attacked by any bishop.'
    })
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: { hu: 'Teszt 🤖', en: 'Test 🤖' } },
    { botStrategy: smartBotStrategy, generateStartBoard, label: { hu: 'Okos 🤖', en: 'Smart 🤖' }, isDefault: true }
  ]
});
