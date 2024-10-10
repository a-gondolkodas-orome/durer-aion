import React, { useState } from 'react';
import { range, cloneDeep, isNull } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn } from './strategy';

const BoardClient = ({ board, ctx, events }) => {
  const isMoveAllowed = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    return board[id] === null;
  };
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    const nextBoard = cloneDeep(board);
    nextBoard[id] = 'removed';
    events.endPlayerTurn(getGameStateAfterMove(nextBoard));
  };

  const isDisabled = id => {
    if (!isMoveAllowed(id)) return true;
    if (id % 3 === 1) return true;
    if(ctx.playerIndex == 0 && id % 3 == 0) return true;
    if (ctx.playerIndex == 1 && id % 3 == 2) return true;
    return false;
  }

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3">
      <span className="text-gray-500 text-xl text-center">Kezdő</span>
      <span></span>
      <span className="text-gray-500 text-xl text-center">Második</span>
    </div>
    <div className="grid grid-cols-3">
      {range(15).map(id => (
        [1, 4, 7, 10, 13].includes(id) || !isNull(board[id])
        ? <span className="aspect-[3/2] m-2" key={id}></span>
        : <button
          key={id}
          disabled={isDisabled(id)}
          onClick={() => clickField(id)}
          className={`
            p-2 m-2 aspect-[3/2] text-3xl border-4 rounded-xl shadow-md
            disabled:cursor-not-allowed
            enabled:border-emerald-400 enabled:border-dashed
            enabled:hover:border-solid enabled:focus:border-solid
          `}
        >
          { isNull(board[id]) && (id === 0 || id === 2) && '1'}
          { isNull(board[id]) && (id === 3 || id === 5) && '2'}
          { isNull(board[id]) && (id === 6 || id === 8) && '3'}
          { isNull(board[id]) && (id === 9 || id === 11) && '4'}
          { isNull(board[id]) && (id === 12 || id === 14) && '5'}
      </button>
      ))}
    </div>
  </section>
  );
};

const rule = <>
  Mindkét játékos előtt 5-5 kártyalap van az 1-5 egész számokkal megszámozva.
  A játékosok felváltva elvesznek egy-egy lapot az ellenfelük elől, egészen addig, amíg
már csak egy-egy lap marad marad előttük. Ha a két megmaradt
szám összege páratlan, akkor az nyer, aki előtt a nagyobbik van; ha páros az összeg, akkor
pedig az, aki előtt a kisebbik (ha ugyanaz a szám marad meg a két játékos előtt, akkor az nyer,
aki kezdte a játékot).
</>;

export const FiveFiveCard = strategyGameFactory({
  rule,
  title: 'Párbaj 5 lappal',
  BoardClient,
  getPlayerStepDescription: () => 'Vegyél el egy kártyát az ellenfél elől.',
  generateStartBoard: () => Array(15).fill(null),
  getGameStateAfterAiTurn
});
