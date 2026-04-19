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
    if (!ctx.isClientMoveAllowed) return;
    moves.addPiece(board, id);
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-2 gap-0 border-2">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!ctx.isClientMoveAllowed}
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

const getPlayerStepDescription = () => ({
  hu: 'Kattints arra a mezőre, ahova korongot szeretnél lerakni.',
  en: 'Click the square where you want to place a piece.'
});

const rule = {
  hu: <>
    Adott egy 2 × 2-es táblázat, és hozzá mindkét játékosnak van 3 db korongja. A
    játék során felváltva tesznek le ezekből egyet-egyet a táblázat tetszőleges mezőjére. A második
    játékos akkor nyer, ha a játék végén minden mezőben különböző számú korong található. (Azaz
    0, 1, 2, 3 a kiosztás a végén valamilyen sorrendben).
  </>,
  en: <>
    There is a board with 4 squares. Both players take turns placing one piece at a time,
    for a total of 3 pieces each. The second player wins if, at the end of the game,
    all squares hold a different number of pieces — i.e.,
    there is exactly one square with 3 pieces, one with 2, one with 1, and one with 0.
  </>
};

export const TwoTimesTwo = strategyGameFactory({
  rule,
  metadata: gameList.TwoTimesTwo,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  moves,
  aiBotStrategy
});
