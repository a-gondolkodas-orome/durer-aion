import React, { useState } from 'react';
import { range, some, isEqual } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import {
  getAllowedMoves, getGameStateAfterAiTurn, getGameStateAfterMove, generateStartBoard
} from './strategy/strategy';
import { ChessRookSvg } from './chess-rook-svg';

const GameBoard = ({ board, ctx, events }) => {
  const clickField = (field) => {
    if (!isMoveAllowed(field)) return;

    events.endPlayerTurn(getGameStateAfterMove(board, field));
  };
  const isMoveAllowed = (targetField) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <ChessRookSvg />
    <table className="m-2 border-collapse w-full table-fixed">
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
  GameBoard,
  getPlayerStepDescription: () => 'Kattints egy szabad mezőre a bástyával egy sorban vagy oszlopban.',
  generateStartBoard,
  getGameStateAfterAiTurn
});
