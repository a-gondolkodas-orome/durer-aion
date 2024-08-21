import React, { useState } from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, random } from 'lodash';

const GameBoard = ({board, ctx}) => {

  const clickNumber = (number) => {
    if (!ctx.shouldPlayerMoveNext) return;
    ctx.endPlayerTurn(getGameStateAfterMove(board + number, ctx.playerIndex));
  };

  return(
    <section className="p-2 shrink-0 grow basis-2/3">
      <p className='text-center text-[30px]'>Jelenlegi szám: {board}</p>
      <div className="flex">
        {range(1, 4).map(i => (
          <button
            disabled={!ctx.shouldPlayerMoveNext}
            className={`
              text-center w-full text-xl m-2 rounded border-4
              enabled:hover:bg-blue-400 enabled:focus:bg-blue-400
            `}
            key={`${board}+${i}`}
            onClick={() => clickNumber(i)}
          >+{i}</button>
        ))}
      </div>
    </section>
  );
};

const getGameStateAfterMove = (nextBoard, moverIndex) => {
  if (nextBoard > 40) {
    return { nextBoard, isGameEnd: true, winnerIndex: 1 - moverIndex };
  }
  return { nextBoard, isGameEnd: false };
};

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const nextBoard = board % 4 !== 0
    ? board + 4 - board % 4
    : board + random(1, 3);
  return (getGameStateAfterMove(nextBoard, 1-playerIndex));
};

const rule = <>
  A játék a nullával indul. A játékosok felváltva
  mondhatnak (pozitív egész) számokat: a soron következő játékos mindig 1-gyel, 2-vel vagy 3-mal
  nagyobb számot mondhat, mint amit az előző mondott. Az veszít, aki először nagyobbat mond
  40-nél.
</>;

const Game = strategyGameFactory({
  rule: rule,
  title: '+1, +2, +3',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Válaszd ki, hogy mennyivel szeretnéd növelni a számot.',
    generateStartBoard: () => 0,
    getGameStateAfterAiTurn
  }
});

export const PlusOneTwoThree = () => {
  const [board, setBoard] = useState(0);

  return <Game board={board} setBoard={setBoard}/>;
}
