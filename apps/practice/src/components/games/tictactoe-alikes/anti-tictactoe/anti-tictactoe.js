import React from 'react';
import { range, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { generateEmptyTicTacToeBoard } from '../helpers';
import { isGameEnd, hasFirstPlayerWon } from './helpers';
import { aiBotStrategy } from './bot-strategy';

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
              className={`w-full aspect-square inline-block rounded-full mb-[-0.5rem] ${pieceColor(id)}`}
            ></span>
          )}
      </button>
      ))}
    </div>
  </section>
  );
};

const moves = {
  placePiece: (board, { ctx, events }, id) => {
    const nextBoard = cloneDeep(board);
    nextBoard[id] = ctx.currentPlayer === 0 ? 'red' : 'blue';
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame({ winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 });
    }
    return { nextBoard };
  }
}

const rule = <>
  A 3×3-as antiamőba játékban a kezdő piros, a második kék korongokat rak le. Felváltva
  lépnek, és az veszít, akinek először lesz a saját színéből három korongja egy sorban, oszlopban vagy
  átlóban. Ha mind a kilenc mező foglalt és nincs ilyen koronghármas, akkor a kezdő nyer.
</>;

export const AntiTicTacToe = strategyGameFactory({
  rule,
  title: '3x3-as antiamőba',
  BoardClient,
  getPlayerStepDescription: () => 'Helyezz le egy korongot egy üres mezőre kattintással.',
  generateStartBoard: generateEmptyTicTacToeBoard,
  moves,
  aiBotStrategy
});
