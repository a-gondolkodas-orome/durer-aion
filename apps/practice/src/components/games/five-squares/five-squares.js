import React from 'react';
import { range, sum, isEqual, random, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy } from './bot-strategy';

const generateStartBoard = () => {
  const board = Array(5).fill(0);
  const x = random(4);
  board[x] += 1;
  return board;
};

const moves = {
  addPiece: (board, { ctx, events }, pileId) => {
    const nextBoard = cloneDeep(board);
    nextBoard[pileId] += 1;
    if (ctx.currentPlayer === 1 && [3, 6, 9].includes(sum(nextBoard))) {
      // player still has one more piece to place in their turn
      return { nextBoard };
    }
    events.endTurn();
    if (sum(nextBoard) === 10) {
      const winnerIndex = isEqual(cloneDeep(nextBoard).sort(), [0, 1, 2, 3, 4]) ? 1 : 0;
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
    <div className="grid grid-cols-3 gap-0 border-t-4 border-l-4">
      {range(board.length).map(id =>
        <button
          key={id}
          disabled={!ctx.shouldRoleSelectorMoveNext}
          onClick={() => placePiece(id)}
          className="aspect-square border-r-4 border-b-4 p-[3%]"
        >
          {range(board[id]).map((i) =>
            <span
              key={i}
              className={`
                m-[2%] aspect-square inline-block bg-blue-600 rounded-full
                ${board[id] <= 4 ? 'w-[37%]' : (board[id] <= 6 ? 'w-[28%]': 'w-[20%]')}
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
  A játék során egy öt mezőből álló táblára helyezünk korongokat. Kezdetben egy korong van a táblán.
  Ezután minden körben a kezdőjátékos egy korongot helyez a táblára, majd ezután a második játékos tesz le két
  korongot. (A két korongot lehet azonos, illetve különböző mezőkre is tenni.) A játék 3 kör után ér véget,
  amikor a 10. korong felkerül a táblára. A második játékos akkor nyer, ha a játék végén
  minden mezőn különböző számú korong áll.
</>;

export const FiveSquares = strategyGameFactory({
  rule,
  title: '5 mezőbe különbözőt',
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  moves,
  aiBotStrategy
});
