import React from 'react';
import { range, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { generateEmptyTicTacToeBoard } from '../helpers';
import { aiBotStrategy } from './bot-strategy';
import { inPlacingPhase, aiColor, isGameEnd } from './helpers';
import { gameList } from '../../gameList';

const BoardClient = ({ board, ctx, moves }) => {
  const gameIsInPlacingPhase = inPlacingPhase(board);
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    if (gameIsInPlacingPhase) {
      moves.placePiece(board, id);
    } else {
      moves.whitenPiece(board, id);
    }
  };
  const isMoveAllowed = (id) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if (gameIsInPlacingPhase) {
      return board[id] === null;
    } else {
      return board[id] === aiColor;
    }
  };
  const pieceColor = (id) => {
    const colorCode = board[id];
    if (colorCode === 'red') return 'bg-red-600';
    if (colorCode === 'white') return 'bg-white';
    return 'bg-blue-600';
  };

  /*
  Due to simulating borders with the background peeking through gaps, we need
  to explicitly give bg-white to children.
  */
  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3 bg-slate-200 gap-1 p-1">
      {range(9).map(id => (
        <button
          key={id}
          disabled={!isMoveAllowed(id)}
          onClick={() => clickField(id)}
          className={`
            aspect-square p-[25%]
            ${!isMoveAllowed(id) && ctx.shouldRoleSelectorMoveNext ? 'cursor-not-allowed' : ''}
            ${!gameIsInPlacingPhase && isMoveAllowed(id) ? 'bg-green-100' : 'bg-white'}
          `}
        >
          {board[id] && (
            <span
              className={`
                w-full aspect-square block rounded-full
                ${pieceColor(id)}
                ${pieceColor(id) === 'bg-white' ? 'border-4 border-slate-600' : ''}
              `}
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
    nextBoard[id] = ctx.currentPlayer === ctx.chosenRoleIndex ? 'blue' : 'red';
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame();
    }
    return { nextBoard };
  },
  whitenPiece: (board, { events }, id) => {
    const nextBoard = cloneDeep(board);
    nextBoard[id] = 'white';
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame();
    }
    return { nextBoard };
  }
}

const getPlayerStepDescription = ({ board }) => {
  return inPlacingPhase(board)
    ? 'Helyezz le egy korongot egy üres mezőre kattintással.'
    : 'Kattints egy piros korongra.';
};

const rule = <>
  Két játékos játszik egy 3 × 3-as táblán kék és piros korongokkal a szokásos amőba
  szabályai szerint, tehát felváltva tesznek le korongokat, és ha egy sorban, oszlopban vagy átlóban
  összegyűlik három azonos színű korong, az adott játékos nyer. Ha az első 9 korong lehelyezése
  után döntetlen az állás (azaz egyik játékos sem nyert), akkor tovább folytatják a játékot, a soron
  következő játékos az ellenfél egy már lehelyezett korongját fehérre színezheti. Ezek után az nyer,
  aki először hoz létre három fehér korongot egy sorban, oszlopban vagy átlóban.
</>;

export const TicTacToe = strategyGameFactory({
  rule,
  metadata: gameList.TicTacToe,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard: generateEmptyTicTacToeBoard,
  moves,
  aiBotStrategy
});
