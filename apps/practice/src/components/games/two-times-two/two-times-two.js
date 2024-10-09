import React, { useState } from 'react';
import { range, sum, isEqual } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getOptimalTileIndex } from './strategy';

const generateStartBoard = () => [0, 0, 0, 0];

const isGameEnd = board => sum(board) === 6;

const getWinnerIndex = (board) => {
  if (!isGameEnd(board)) return null;
  const isAllDifferent = isEqual([...board].sort(), [0, 1, 2, 3]);
  return isAllDifferent ? 1 : 0;
};

const addPiece = (board, pileId) => {
  const nextBoard = [...board];
  nextBoard[pileId] += 1;
  return nextBoard;
};

const getGameState = nextBoard => ({
  nextBoard,
  isGameEnd: isGameEnd(nextBoard),
  winnerIndex: getWinnerIndex(nextBoard)
});

const getGameStateAfterAiTurn = ({ board }) => {
  const pileId = getOptimalTileIndex(board);
  const nextBoard = addPiece(board, pileId);
  return getGameState(nextBoard);
};

const GameBoard = ({ board, ctx, events }) => {
  const placePiece = id => {
    const nextBoard = addPiece(board, id);
    events.endPlayerTurn(getGameState(nextBoard));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-2 gap-0 border-2">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!ctx.shouldPlayerMoveNext}
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
  title: '4 mezőbe különbözőt',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateStartBoard,
    getGameStateAfterAiTurn
  }
});
