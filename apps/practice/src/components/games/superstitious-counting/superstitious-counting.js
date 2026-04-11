import React from 'react';
import { range, sample, difference } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy } from './bot-strategy';
import { gameList } from '../gameList';
import { useTranslation } from '../../language/translate';

const generateStartBoard = () => {
  const losingPositions = range(29, 127, 14);
  const winningPositions = difference(range(26, 115), losingPositions);
  const target = sample([sample(losingPositions), sample(winningPositions)]);
  return { current: 0, target, restricted: null };
};

const BoardClient = ({ board, ctx, moves }) => {
  const { t } = useTranslation();
  const fields = range(board.target + 14);

  const isMoveAllowed = (step) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if(step === board.restricted || step <= 0 || step >= 13) {
      return false;
    }
    return true;
  };

  const makeStep = (step) => {
    if (!isMoveAllowed(step)) return;
    moves.step(board, step);
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
            enabled:bg-emerald-200 enabled:hover:bg-emerald-400 enabled:focus:bg-emerald-400
            ${i === board.target ? 'border-8 border-purple-600' : '' }
            ${board.restricted && i === board.current + board.restricted ? 'bg-red-200' : '' }
            ${i < board.current ? 'bg-slate-400' : ''}
            ${i === board.current ? 'bg-slate-200' : ''}
            ${i > board.target ? 'text-slate-400 border-purple-600' : ''}
          `}
        >{ i === board.current ? 'X' : i }
      </button>
      )}
    </div>
    <span className = "text-xl">
      {t({
        hu: `m értéke: ${board.target}`,
        en: `Value of m: ${board.target}`
      })}
    </span>
    {ctx.shouldRoleSelectorMoveNext && (
      <p className="text-xl">
        {t({
          hu: `Előző lépés: ${board.restricted ? (13 - board.restricted) : '-'}. ` +
            `Tiltott: ${ board.restricted || '-' }.`,
          en: `Previous step: ${board.restricted ? (13 - board.restricted) : '-'}. ` +
            `Forbidden: ${board.restricted || '-'}.`
        })}
      </p>
    )}
  </section>
  );
};

const moves = {
  step: (board, { ctx, events }, step) => {
    const numberAfterStep = board.current + step;
    const nextBoard = { current: numberAfterStep, target: board.target, restricted: 13 - step };
    events.endTurn();
    if (numberAfterStep >= board.target) {
      events.endGame({ winnerIndex: 1 - ctx.currentPlayer })
    }
    return { nextBoard };
  }
};

const rule = {
  hu: <>
    Károly és Dezső <code>m</code>-ig szeretnének elszámolni, és közben a következő játékot játsszák:
    0-ról kezdenek, a két játékos felváltva adhat hozzá egy 13-nál (szigorúan) kisebb pozitív egészet a korábbi
    számhoz, azonban a babonájuk miatt ha egyikük <code>x</code>-et adott hozzá, akkor másikuk a következő
    lépésben nem adhat hozzá <code>13-x</code>-et. Az veszít, aki eléri (vagy átlépi) <code>m</code>-et.
  </>,
  en: <>
    Károly and Dezső wish to count up to <code>m</code> and play the following game in the
    meantime: they start from 0 and the two players can add a positive number less than 13 to the
    previous number, taking turns. However because of their superstition, if one of them added <code>x</code>,
    then the other one in the next step cannot add <code>13-x</code>. Whoever reaches
    (or surpasses) <code>m</code> first, loses.
  </>
};

export const SuperstitiousCounting = strategyGameFactory({
  rule,
  metadata: gameList.SuperstitiousCounting,
  BoardClient,
  getPlayerStepDescription: () => ({
    hu: 'Kattints a számra ahova lépni szeretnél.',
    en: 'Click on a number to step onto it.'
  }),
  generateStartBoard,
  moves,
  aiBotStrategy
});
