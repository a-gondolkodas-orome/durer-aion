import React from 'react';
import { range, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { getGameStateAfterMove, getGameStateAfterAiTurn, playerColor } from './strategy/strategy';
import { generateEmptyTicTacToeBoard } from '../helpers';

const BoardClient = ({ board, ctx, events, moves }) => {
  const isDuringFirstMove = board => board.filter(c => c).length <= 1;

  const isMoveAllowed = (id) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return board[id] === null;
  };
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    const nextBoard = cloneDeep(board);
    nextBoard[id] = playerColor(ctx.chosenRoleIndex);
    moves.setBoard(nextBoard);
    if (isDuringFirstMove(nextBoard)) return;
    const { isGameEnd, winnerIndex } = getGameStateAfterMove(nextBoard);
    events.endTurn();
    if (isGameEnd) {
      events.endGame({ winnerIndex });
    }
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
              className={`w-full aspect-square inline-block rounded-full mb-[-0.5rem] ${pieceColor(id)}`}
            ></span>
          )}
      </button>
      ))}
    </div>
  </section>
  );
};

const getPlayerStepDescription = ({ board }) => {
  const isDuringFirstMove = board.filter(c => c).length <= 1;
  return isDuringFirstMove
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
  title: 'Duplánkezdő 3x3 amőba',
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard: generateEmptyTicTacToeBoard,
  getGameStateAfterAiTurn
});
