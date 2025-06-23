import React from 'react';
import { compact, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { RockSvg } from './symbols/rock-svg';
import { PaperSvg } from './symbols/paper-svg';
import { ScissorSvg } from './symbols/scissor-svg';

const BoardClient = ({ board, ctx, moves }) => {
  const isMoveAllowed = (symbolIdx) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return board[1 - ctx.chosenRoleIndex][symbolIdx] !== null;
  };

  const clickField = (symbolIdx) => {
    if (!isMoveAllowed(symbolIdx)) return;

    moves.removeSymbol(board, symbolIdx)
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3">
      <span className="text-gray-500 text-xl text-center">Kezdő</span>
      <span></span>
      <span className="text-gray-500 text-xl text-center">Második</span>
    </div>
    <div className="grid grid-cols-3">
      {[0, 1, 2].map(symbolIdx => (
        [0, null, 1].map(playerIdx => (
          playerIdx === null || board[playerIdx][symbolIdx] === null
          ? <span className="aspect-4/5 m-2" key={`${playerIdx}-${symbolIdx}`}></span>
          : <button
              key={`${playerIdx}-${symbolIdx}`}
              disabled={playerIdx === ctx.chosenRoleIndex || !isMoveAllowed(symbolIdx)}
              onClick={() => clickField(symbolIdx)}
              className={`
                p-2 m-2 aspect-4/5 border-4 rounded-xl shadow-md
                disabled:cursor-not-allowed
                enabled:border-emerald-400 enabled:border-dashed
                enabled:hover:border-solid enabled:focus:border-solid
              `}
            >
              { symbolIdx === 0 && (<RockSvg />) }
              { symbolIdx === 1 && (<PaperSvg />) }
              { symbolIdx === 2 && (<ScissorSvg />) }
            </button>
        ))
      ))}
    </div>
  </section>
  );
};

const isGameEnd = (board) => {
  return compact(board[0]).length === 1 && compact(board[1]).length === 1;
};

const getWinnerIndex = (board) => {
  if (!isGameEnd(board)) return undefined;
  const pairs = [[0, 2], [1, 0], [2, 1]];
  for (const p of pairs) {
    if (board[0][p[0]] !== null && board[1][p[1]]) {
      return 0;
    }
  }
  return 1;
};

const moves = {
  removeSymbol: (board, { ctx, events }, idx) => {
    const nextBoard = cloneDeep(board);
    nextBoard[1 - ctx.currentPlayer][idx] = null;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame({ winnerIndex: getWinnerIndex(nextBoard) });
    }
    return { nextBoard };
  }
}

const rule = <>
  A játék kezdetekor mindkét játékos elé leteszünk három kártyát: az egyik követ, a
másik papírt, a harmadik ollót ábrázol. Ezután a játékosok felváltva elvesznek egy-egy kártyát az
ellenfelük elől, egészen addig, amíg már csak egy-egy kártya marad. Ekkor a megmaradt kártyákat
ütköztetik a „kő-papír-olló” játék szabályai szerint, így eldöntve, hogy ki a győztes; ha mindkét
kártyán ugyanaz van, akkor a Kezdő nyert.
</>;

export const RockPaperScissor = strategyGameFactory({
  rule,
  title: 'Kő-papír-olló',
  BoardClient,
  getPlayerStepDescription: () => 'Távolíts el egy kártyát az ellenfél elől.',
  generateStartBoard: () => [['rock', 'paper', 'scissor'], ['rock', 'paper', 'scissor']],
  moves,
  aiBotStrategy
});
