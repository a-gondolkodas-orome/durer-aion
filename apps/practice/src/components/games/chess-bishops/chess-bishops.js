import React, { useState } from 'react';
import { range, isEqual, some } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { ChessBishopSvg } from './chess-bishop-svg';
import {
  getGameStateAfterAiTurn, getGameStateAfterMove, getAllowedMoves, generateStartBoard,
  BISHOP, FORBIDDEN
} from './strategy/strategy';

const GameBoard = ({ board, ctx }) => {
  const [hoveredField, setHoveredField] = useState(null);
  const clickField = (field) => {
    if (!isMoveAllowed(field)) return;

    ctx.endPlayerTurn(getGameStateAfterMove(board, field));
  };

  const isPotentialNextStep = (field) => {
    if (!isMoveAllowed(field)) return false;
    if (!hoveredField) return false;
    return isEqual(hoveredField, field);
  };
  const isMoveAllowed = (targetField) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    return some(getAllowedMoves(board), field => isEqual(field, targetField));
  };
  const isForbidden = ({ row, col }) => {
    return board[row][col] === FORBIDDEN;
  };
  const isBishop = ({ row, col }) => {
    return board[row][col] === BISHOP;
  };
  const wouldBeForbidden = ({ row, col }) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (!hoveredField) return false;
    if (!isMoveAllowed(hoveredField)) return false;
    if (!isMoveAllowed({ row, col })) return false;
    if (isPotentialNextStep({ row, col })) return false;
    return Math.abs(row - hoveredField.row) === Math.abs(col - hoveredField.col);
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <ChessBishopSvg />
    <table className="m-2 w-full border-collapse table-fixed">
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

const rule = <>
  Két játékos felváltva tesz le (a kezdetben üres) sakktáblára futókat. Egy új futót mindig
  csak olyan mezőre tehetünk, amin még nem áll futó, és azt a mezőt nem is támadja futó. Az
  veszít, aki nem tud lerakni futót. (Futó támad egy mezőt: ha a sakk szabályai szerint a futóval
  arra a mezőre tudnánk lépni, azaz a futóhoz képest átlósan helyezkedik el.)

  Te döntheted el, hogy kezdeni szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: 'Sakktáblán futók',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Kattints egy mezőre, amit nem üt egyik futó sem.',
    generateStartBoard,
    getGameStateAfterAiTurn
  }
});

export const ChessBishops = () => {
  const [board, setBoard] = useState(generateStartBoard());

  return <Game board={board} setBoard={setBoard} />;
};
