import React from 'react';
import { range, sum, isEqual, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { gameList } from '../gameList';

const generateStartBoard = () => [0, 0, 0, 0];

const moves = {
  addPiece: (board, { events }, pileId) => {
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] += 1;
    events.endTurn();
    if (sum(nextBoard) === 6) {
      const winnerIndex = isEqual(cloneDeep(nextBoard).sort(), [0, 1, 2, 3]) ? 1 : 0;
      events.endGame({ winnerIndex });
    }
    return { nextBoard };
  }
}

const BoardClient = ({ board, ctx, moves }) => {
  const placePiece = id => {
    if (!ctx.shouldRoleSelectorMoveNext) return;
    moves.addPiece(board, id);
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-2 gap-0 border-2">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!ctx.shouldRoleSelectorMoveNext}
          onClick={() => placePiece(id)}
          className="aspect-square border-2 p-[4%]"
        >
          {range(board[id]).map((i) =>
            <span
              key={i}
              className={`
                m-[3%] aspect-square inline-block bg-blue-600 rounded-full
                ${board[id] <= 4 ? 'w-[40%]' : 'w-[25%]'}
              `}
            >
            </span>
          )}
      </button>
      )}
    </div>
  </section>
  );
};

const getPlayerStepDescription = () =>
  'Kattints arra a mezőre, ahova korongot szeretnél lerakni.';

const rule = <>
  Adott egy 2 × 2-es táblázat, és hozzá mindkét játékosnak van 3 db korongja. A
  játék során felváltva tesznek le ezekből egyet-egyet a táblázat tetszőleges mezőjére. A második
  játékos akkor nyer, ha a játék végén minden mezőben különböző számú korong található. (Azaz
  0, 1, 2, 3 a kiosztás a végén valamilyen sorrendben).
</>;

export const TwoTimesTwo = strategyGameFactory({
  rule,
  metadata: gameList.TwoTimesTwo,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  moves,
  aiBotStrategy
});
