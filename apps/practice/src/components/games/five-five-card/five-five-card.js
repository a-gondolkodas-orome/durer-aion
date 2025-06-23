import React from 'react';
import { range, cloneDeep, compact } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }) => {
  const isMoveAllowed = (id) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return board[1 - ctx.chosenRoleIndex][id] !== null;
  };
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    moves.removeCard(board, id + 1);
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3">
      <span className="text-gray-500 text-xl text-center">Kezdő</span>
      <span></span>
      <span className="text-gray-500 text-xl text-center">Második</span>
    </div>
    <div className="grid grid-cols-3">
      {range(5).map(id => (
        [0, null, 1].map(playerIdx => (
          playerIdx === null || board[playerIdx][id] === null
          ? <span className="aspect-3/2 m-2" key={`${playerIdx}-${id}`}></span>
          : <button
              key={`${playerIdx}-${id}`}
              disabled={playerIdx === ctx.chosenRoleIndex || !isMoveAllowed(id)}
              onClick={() => clickField(id)}
              className={`
                p-2 m-2 aspect-3/2 text-3xl border-4 rounded-xl shadow-md
                disabled:cursor-not-allowed
                enabled:border-emerald-400 enabled:border-dashed
                enabled:hover:border-solid enabled:focus:border-solid
              `}
            >
              {board[playerIdx][id]}
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

const getWinnerIndex = board => {
  if (!isGameEnd(board)) return undefined;
  const firstPlayerNumber = compact(board[0])[0];
  const secondPlayerNumber = compact(board[1])[0]

  if (firstPlayerNumber === secondPlayerNumber) return 0;
  if ((firstPlayerNumber + secondPlayerNumber) % 2 === 0){
    return firstPlayerNumber < secondPlayerNumber ? 0 : 1;
  } else {
    return firstPlayerNumber > secondPlayerNumber ? 0 : 1;
  }
}

const moves = {
  removeCard: (board, { ctx, events }, id) => {
    const nextBoard = cloneDeep(board);
    nextBoard[1 - ctx.currentPlayer][id - 1] = null;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame({ winnerIndex: getWinnerIndex(nextBoard) });
    }
    return { nextBoard };
  }
}

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
  generateStartBoard: () => [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
  moves,
  aiBotStrategy
});
