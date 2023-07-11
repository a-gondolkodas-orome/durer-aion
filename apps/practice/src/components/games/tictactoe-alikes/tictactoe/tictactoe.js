import React, { useState } from 'react';
import { range, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../../strategy-game';
import { generateEmptyTicTacToeBoard } from '../helpers';
import { inPlacingPhase, pColor, aiColor, getGameStateAfterMove, getGameStateAfterAiTurn } from './strategy/strategy';

const GameBoard = ({ board, ctx }) => {
  const gameIsInPlacingPhase = inPlacingPhase(board);
  const clickField = (id) => {
    if (!isMoveAllowed(id)) return;

    const newBoard = cloneDeep(board);
    newBoard[id] = gameIsInPlacingPhase ? pColor : 'white';
    ctx.endPlayerTurn(getGameStateAfterMove(newBoard));
  };
  const isMoveAllowed = (id) => {
    if (!ctx.shouldPlayerMoveNext) return false;
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

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="grid grid-cols-3 gap-0 border-2">
      {range(9).map(id => (
        <button
          key={id}
          disabled={!isMoveAllowed(id)}
          onClick={() => clickField(id)}
          className={`
            aspect-square p-[25%] border-2
            ${!isMoveAllowed(id) && ctx.shouldPlayerMoveNext ? 'cursor-not-allowed' : ''}
            ${!gameIsInPlacingPhase && isMoveAllowed(id) ? 'bg-green-100' : ''}
          `}
        >
          {board[id] && (
            <span
              className={`
                w-full aspect-square inline-block rounded-full mb-[-0.5rem]
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

const getPlayerStepDescription = ({ board }) => {
  return inPlacingPhase(board)
    ? 'Kattints egy üres mezőre.'
    : 'Kattints egy piros korongra.';
};

const rule = <>
  Két játékos játszik egy 3 × 3-as táblán kék és piros korongokkal a szokásos amőba
  szabályai szerint, tehát felváltva tesznek le korongokat, és ha egy sorban, oszlopban vagy átlóban
  összegyűlik három azonos színű korong, az adott játékos nyer. Ha az első 9 korong lehelyezése
  után döntetlen az állás (azaz egyik játékos sem nyert), akkor tovább folytatják a játékot, a soron
  következő játékos az ellenfél egy már lehelyezett korongját fehérre színezheti. Ezek után az nyer,
  aki először hoz létre három fehér korongot egy sorban, oszlopban vagy átlóban.

  Te döntheted el, hogy kezdeni szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: 'Átszínezős Tic Tac Toe',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateNewBoard: generateEmptyTicTacToeBoard,
    getGameStateAfterAiTurn
  }
});

export const TicTacToe = () => {
  const [board, setBoard] = useState(generateEmptyTicTacToeBoard());

  return <Game board={board} setBoard={setBoard} />;
};
