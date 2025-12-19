import React from 'react';
import { range, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { generateEmptyTicTacToeBoard } from '../helpers';
import { isGameEnd, hasFirstPlayerWon } from './helpers';
import { gameList } from '../../gameList';

const BoardClient = ({ board, ctx, moves }) => {
  const isMoveAllowed = (id) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return board[id] === null;
  };
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;
    moves.placePiece(board, id);
  };
  const pieceColor = (id) => {
    const colorCode = board[id];
    if (colorCode === 'red') return 'bg-red-600';
    return 'bg-blue-600';
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3 gap-0 border-2">
      {range(9).map(id => (
        <button
        key={id}
        disabled={!isMoveAllowed(id)}
        onClick={() => clickField(id)}
        className="aspect-square p-[25%] border-2"
        >
          {board[id] && (
            <span
            className={`w-full aspect-square inline-block rounded-full -mb-2 ${pieceColor(id)}`}
            ></span>
          )}
      </button>
      ))}
    </div>
  </section>
  );
};

const isDuringFirstMove = board => board.filter(c => c).length <= 1;

const moves = {
  placePiece: (board, { ctx, events }, id) => {
    const nextBoard = cloneDeep(board);
    nextBoard[id] = ctx.currentPlayer === 0 ? 'red' : 'blue';

    if (!isDuringFirstMove(nextBoard)) {
      events.endTurn();
      if (isGameEnd(nextBoard)) {
        events.endGame({ winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 });
      }
    }

    return { nextBoard };
  }
};

const getPlayerStepDescription = ({ board }) => {
  return isDuringFirstMove(board)
    ? 'Helyezz le két korongot egy-egy üres mezőre kattintással.'
    : 'Helyezz le egy korongot egy üres mezőre kattintással.';
};

const rule = <>
  A 3 × 3-as duplánkezdő amőba játékban először a kezdő tesz le két piros korongot, majd
  a második egy kék korongot és innentől felváltva egy-egy korongot tesznek le a saját színükből, amíg
  be nem telik a tábla. A kezdő nyer, ha a játék végén van valahol három piros egy sorban, oszlopban
  vagy átlóban, de sehol sincs három kék egy sorban, oszlopban vagy átlóban; egyébként a második
  nyer.
</>;

export const TicTacToeDoubleStart = strategyGameFactory({
  rule,
  metadata: gameList.TicTacToeDoubleStart,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard: generateEmptyTicTacToeBoard,
  moves,
  aiBotStrategy
});
