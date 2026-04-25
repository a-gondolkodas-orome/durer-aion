import React, { useState } from 'react';
import { range, isEqual, some, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import { ChessBishopSvg } from './chess-bishop-svg';
import { aiBotStrategy } from './bot-strategy';
import { generateStartBoard, getAllowedMoves, BISHOP, FORBIDDEN, markForbiddenFields } from './helpers';
import { gameList } from '../gameList';

const BoardClient = ({ board, ctx, moves }) => {
  const [hoveredField, setHoveredField] = useState(null);
  const clickField = (field) => {
    if (!isMoveAllowed(field)) return;

    moves.placeBishop(board, field);
  };

  const isPotentialNextStep = (field) => {
    if (!isMoveAllowed(field)) return false;
    if (!hoveredField) return false;
    return isEqual(hoveredField, field);
  };
  const isMoveAllowed = (targetField) => {
    if (!ctx.isClientMoveAllowed) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };
  const isForbidden = ({ row, col }) => {
    return board[row][col] === FORBIDDEN;
  };
  const isBishop = ({ row, col }) => {
    return board[row][col] === BISHOP;
  };
  const wouldBeForbidden = ({ row, col }) => {
    if (!ctx.isClientMoveAllowed) return false;
    if (!hoveredField) return false;
    if (!isMoveAllowed(hoveredField)) return false;
    if (!isMoveAllowed({ row, col })) return false;
    if (isPotentialNextStep({ row, col })) return false;
    return Math.abs(row - hoveredField.row) === Math.abs(col - hoveredField.col);
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <ChessBishopSvg />
    <table className="w-full border-collapse table-fixed">
      <tbody>
        {range(8).map(row => (
          <tr key={row}>
            {range(8).map(col => (
              <td
                key={col}
                onClick={() => clickField({ row, col })}
                className={`
                  border-4 ${isForbidden({ row, col }) ? 'bg-slate-400 cursor-not-allowed' : ''}
                  ${wouldBeForbidden({ row, col }) ? 'bg-slate-200' : ''}
                `}
              >
                <button
                  className="aspect-square w-full p-[5%]"
                  disabled={!isMoveAllowed({ row, col })}
                  onMouseOver={() => setHoveredField({ row, col })}
                  onMouseOut={() => setHoveredField(null)}
                  onFocus={() => setHoveredField({ row, col })}
                  onBlur={() => setHoveredField(null)}
                >
                  {isBishop({ row, col }) && (
                    <span>
                      <svg className="inline-block w-full aspect-square">
                        <use xlinkHref="#game-chess-bishop" />
                      </svg>
                    </span>
                  )}
                  {isPotentialNextStep({ row, col }) && (
                    <span>
                      <svg className="inline-block w-full aspect-square opacity-50">
                        <use xlinkHref="#game-chess-bishop" />
                      </svg>
                    </span>
                  )}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </section>
  );
};

const moves = {
  placeBishop: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);
    markForbiddenFields(nextBoard, { row, col });
    nextBoard[row][col] = BISHOP;
    events.endTurn();
    if (getAllowedMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
}

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
  rule,
  metadata: gameList.ChessBishops,
  BoardClient,
  getPlayerStepDescription: () => ({
    hu: 'Kattints egy mezőre, amit nem üt egyik futó sem.',
    en: 'Click on a square that is not attacked by any bishop.'
  }),
  moves,
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard }]
});
