import React, { useState } from 'react';
import { range, random } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getOptimalAiStep } from './strategy';

const generateNewBoard = () => {
  return { current: 0, target: random(20, 100), restricted: null };
};

const getGameStateAfterMove = (board, step, moverIndex) => {
  const numberAfterStep = board.current + step;
  const isGameEnd = numberAfterStep >= board.target;
  return {
    newBoard: { current: numberAfterStep, target: board.target, restricted: 13 - step },
    isGameEnd,
    winnerIndex: isGameEnd ? (1 - moverIndex) : null
  };
};

const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  const step = getOptimalAiStep(board);
  return getGameStateAfterMove(board, step, 1 - playerIndex);
};

const GameBoard = ({ board, ctx }) => {
  const fields = range(board.target + 14);

  const isMoveAllowed = (step) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if(step === board.restricted || step <= 0 || step >= 13) {
      return false;
    }
    return true;
  };

  const makeStep = (step) => {
    if (!isMoveAllowed(step)) return;
    ctx.endPlayerTurn(getGameStateAfterMove(board, step, ctx.playerIndex));
  };

  return (
  <section className="p-2 shrink-0 grow basis-2/3">
    <div className="flex flex-wrap mb-1">
      {fields.map(i =>
        <button
          key={i}
          disabled={!isMoveAllowed(i - board.current)}
          onClick={() => makeStep(i - board.current)}
          className={`
            border-2 text-2xl min-w-[4ch] text-center p-1 my-1 font-bold
            ${isMoveAllowed(i - board.current) ? 'bg-emerald-200 hover:bg-emerald-400' : '' }
            ${board.restricted && i === board.current + board.restricted ? 'bg-red-200' : '' }
            ${i < board.current ? 'bg-slate-400' : ''}
            ${i === board.current ? 'bg-slate-200' : ''}
            ${i > board.target + 1 ? 'text-slate-400' : ''}
          `}
        >{ i === board.current ? 'X' : i }
      </button>
      )}
    </div>
    {ctx.shouldPlayerMoveNext && (
      <p className="text-xl">
        Előző lépés: { board.restricted ? (13 - board.restricted) : '-' }. Tiltott: { board.restricted || '-' }.
      </p>
    )}
  </section>
  );
};

const rule = <>
  Károly és Dezső <pre className="inline">m</pre>-ig szeretnének elszámolni, és közben a következő játékot játsszák:
  0-ról kezdenek, a két játékos felváltva adhat hozzá egy 13-nál kisebb pozitív egészet a korábbi
  számhoz, azonban a babonájuk miatt ha egyikük x-et adott hozzá, akkor másikuk a következő
  lépésben nem adhat hozzá <pre className="inline">13-x</pre>-et. Az veszít, aki eléri (vagy átlépi) <pre className="inline">m</pre>-et.

  Az <pre className="inline">m</pre> szám ismeretében te döntheteted el, hogy a kezdő vagy a második játékos bőrébe szeretnél e bújni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: 'Babonás számoló',
  GameBoard,
  G: {
    getPlayerStepDescription: () => 'Kattints a mezőre ahova lépni szeretnél.',
    generateNewBoard,
    getGameStateAfterAiTurn
  }
});

export const SuperstitiousCounting = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
