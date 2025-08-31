import React from 'react';
import { range, some, isEqual, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { getAllowedMoves, generateStartBoard, markVisitedFields } from './helpers';
import { ChessRookSvg } from './chess-rook-svg';

const BoardClient = ({ board, ctx, moves }) => {
  const clickField = (field) => {
    if (!isMoveAllowed(field)) return;

    moves.moveRook(board, field);
  };
  const isMoveAllowed = (targetField) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <ChessRookSvg />
    <table className="border-collapse w-full table-fixed">
      <tbody>
        {range(8).map(row => (
          <tr key={row}>
            {range(8).map(col => (
              <td
                key={col}
                onClick={() => clickField({ row, col })}
                className={`border-4 ${board.chessBoard[row][col] === 'visited' ? 'bg-slate-300' : ''}`}
              >
                <div className="aspect-square p-[5%] w-full">
                  <button className="w-full aspect-square" disabled={!isMoveAllowed({ row, col })}>
                    {isMoveAllowed({ row, col }) && (
                      <span>
                        <svg className="w-full aspect-square opacity-25 inline-block">
                          <use xlinkHref="#game-chess-rook" />
                        </svg>
                      </span>
                    )}
                    {board.chessBoard[row][col] === 'rook' && (
                      <span>
                        <svg className="w-full aspect-square inline-block">
                          <use xlinkHref="#game-chess-rook" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
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
  moveRook: (board, { events }, { row, col }) => {
    const nextBoard = cloneDeep(board);
    markVisitedFields(nextBoard, nextBoard.rookPosition, { row, col });

    nextBoard.chessBoard[row][col] = 'rook';
    nextBoard.rookPosition = { row, col };

    events.endTurn();
    if (getAllowedMoves(nextBoard).length === 0) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const rule = <>
  A játékosok felváltva lépnek egy bástyával, amely a sakktábla bal felső sarkából indul. A
  bástya vízszintesen vagy függőlegesen bármennyit (legalább egyet) léphet, de egyszerre csak az
  egyik irányba. Azokat a mezőket amikre a bástya lép, illetve a lépés közben áthalad, megjelöljük,
  ezekre a mezőkre már nem léphetünk később (át sem haladhatunk felettük). Az a játékos veszít, aki
  nem tud lépni.
</>;

export const ChessRook = strategyGameFactory({
  rule,
  title: 'Barangolás bástyával',
  BoardClient,
  getPlayerStepDescription: () => 'Kattints egy szabad mezőre a bástyával egy sorban vagy oszlopban.',
  generateStartBoard,
  moves,
  aiBotStrategy
});
