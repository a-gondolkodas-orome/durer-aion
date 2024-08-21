import React, { useState } from 'react';
import { range, cloneDeep, isNull } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn } from './strategy';
import { RockSvg } from './rock-svg';
import { PaperSvg } from './paper-svg';
import { ScissorSvg } from './scissor-svg';

const GameBoard = ({ board, ctx }) => {
  const isMoveAllowed = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    return board[id] === null;
  };
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    const nextBoard = cloneDeep(board);
    nextBoard[id] = 'removed';
    ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
  };
  const isDisabled = (id) => {
    if (!isMoveAllowed(id)) return true;
    if ([1, 4, 7].includes(id)) return true;
    if (ctx.playerIndex === 1) return [2, 5, 8].includes(id);
    if (ctx.playerIndex === 0) return [0, 3, 6].includes(id);
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3">
      <span className="text-gray-500 text-xl text-center">Kezdő</span>
      <span></span>
      <span className="text-gray-500 text-xl text-center">Második</span>
    </div>
    <div className="grid grid-cols-3">
      {range(9).map(id => (
        [1,4,7].includes(id) || !isNull(board[id])
        ? <span className="aspect-[4/5] m-2" key={id}></span>
        : <button
          key={id}
          disabled={isDisabled(id)}
          onClick={() => clickField(id)}
          className={`
            p-2 m-2 aspect-[4/5] border-4 rounded-xl shadow-md
            disabled:cursor-not-allowed
            enabled:border-emerald-400 enabled:border-dashed enabled:hover:border-solid
          `}
        >
          { isNull(board[id]) && (id === 0 || id === 2) && (
            <RockSvg />
          )}
          { isNull(board[id]) && (id === 3 || id === 5) && (
            <PaperSvg />
          )}
          { isNull(board[id]) && (id === 6 || id === 8) && (
            <ScissorSvg />
          )}
      </button>
      ))}
    </div>
  </section>
  );
};

const rule = <>
  A játék kezdetekor mindkét játékos elé leteszünk három kártyát: az egyik követ, a
másik papírt, a harmadik ollót ábrázol. Ezután a játékosok felváltva elvesznek egy-egy kártyát az
ellenfelük elől, egészen addig, amíg már csak egy-egy kártya marad. Ekkor a megmaradt kártyákat
ütköztetik a „kő-papír-olló” játék szabályai szerint, így eldöntve, hogy ki a győztes; ha mindkét
kártyán ugyanaz van, akkor a Kezdő nyert. Sok sikert :)

</>;

const Game = strategyGameFactory({
  rule,
  title: 'Kő Papír Olló',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Távolíts el egy kártyát az ellenfél elől.',
    generateStartBoard: () => Array(9).fill(null),
    getGameStateAfterAiTurn
  }
});

export const RockPaperScissor = () => {
  const [board, setBoard] = useState(Array(9).fill(null));

  return <Game board={board} setBoard={setBoard} />;
};
