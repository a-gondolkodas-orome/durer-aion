import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { some, range, isEqual } from 'lodash';
import { DuckSvg } from './rubber-duck-svg';
import { aiBotStrategy } from './bot-strategy';
import {
  getAllowedMoves,
  DUCK,
  FORBIDDEN,
  moves
} from './helpers';
import { gameList } from '../gameList';

const chessDucksGameFactory = ({ ROWS, COLS }, metadata) => {

  const generateStartBoard = () => {
    return range(0, ROWS).map(() => range(0, COLS).map(() => null));
  };

  const BoardClient = ({ board, ctx, moves }) => {
    const clickField = (field) => {
      if (!isMoveAllowed(field)) return;

      moves.placeDuck(board, field);
    };

    const isMoveAllowed = (targetField) => {
      if (!ctx.shouldRoleSelectorMoveNext) return false;
      return some(getAllowedMoves(board), field => isEqual(field, targetField));
    };

    const isForbidden = ({ row, col }) => {
      return board[row][col] === FORBIDDEN;
    };
    const isDuck = ({ row, col }) => {
      return board[row][col] === DUCK;
    };

    return(
      <section className="p-2 shrink-0 grow basis-2/3">
        <DuckSvg />
        <table className="w-full border-collapse table-fixed">
        <tbody>
          {range(ROWS).map(row => (
            <tr key={row}>
              {range(COLS).map(col => (
                <td
                  key={col}
                  onClick={() => clickField({ row, col })}
                  className={`
                    border-4
                    ${isForbidden({ row, col }) ? 'bg-slate-400 cursor-not-allowed' : ''}
                  `}
                >
                  <button
                    className="aspect-square w-full h-full p-[5%]"
                    disabled={!isMoveAllowed({ row, col })}
                  >
                    {isDuck({ row, col }) && (
                      <span>
                        <svg className="inline-block aspect-square">
                          <use xlinkHref="#game-duck" />
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
    Azt sokan tudják, hogy egy ló hogy lép a sakktáblán, de azt már nagyon kevesen, hogy
  egy kacsa hogyan: a négy oldalszomszédos mezőre tud lépni. A két játékos felváltva rak le a {ROWS} × {COLS}-os
  táblára kacsákat úgy, hogy a lerakott bábu ne üsse a táblán levő kacsák egyikét sem. Az veszít, aki
  nem tud lépni.
  </>;

  return strategyGameFactory({
    rule,
    metadata,
    BoardClient,
    getPlayerStepDescription: () => 'Kattints egy mezőre, amit nem üt egyik kacsa sem.',
    generateStartBoard,
    aiBotStrategy,
    moves
  });
};

export const ChessDucksC = chessDucksGameFactory(
  { ROWS: 4, COLS: 6 },
  gameList.ChessDucksC
);
export const ChessDucksE = chessDucksGameFactory(
  { ROWS: 4, COLS: 7 },
  gameList.ChessDucksE
);
