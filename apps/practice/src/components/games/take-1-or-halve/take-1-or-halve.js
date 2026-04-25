import React, { useState } from 'react';
import { strategyGameFactory } from '../../game-factory/strategy-game';
import { random, range } from 'lodash';
import { gameList } from '../gameList';
import { useTranslation } from '../../language/translate';

const CoinPile = ({ count, hoveredAction }) => (
  <div className="flex flex-wrap justify-center gap-2 p-4" style={{ transform: 'scaleY(-1)' }}>
    {range(count).map(i => {
      const isDimmed =
        (hoveredAction === 'take1' && i === count - 1) ||
        (hoveredAction === 'halve' && i >= count / 2);
      return (
        <div
          key={i}
          className={`w-[11%] aspect-square rounded-full bg-yellow-400 shadow-md shadow-yellow-600
            transition-opacity ${isDimmed ? 'opacity-30' : ''}`}
          style={{ transform: 'scaleY(-1)' }}
        />
      );
    })}
  </div>
);

const BoardClient = ({ board, ctx, moves }) => {
  const { t } = useTranslation();
  const [hoveredAction, setHoveredAction] = useState(null);
  return(
    <section className="p-2 shrink-0 grow basis-2/3">
      <p className="text-xl font-semibold text-center text-stone-600">{board}</p>
      <CoinPile count={board} hoveredAction={hoveredAction} />
      <div className="flex flex-wrap">
        <span className="grow px-2">
          <button
            className='cta-button'
            disabled={!ctx.isClientMoveAllowed}
            onClick={() => moves.take1(board)}
            onMouseEnter={() => setHoveredAction('take1')}
            onMouseLeave={() => setHoveredAction(null)}
          >{t({ hu: 'Elveszek egyet', en: 'Take one' })}</button>
        </span>
        <span className='grow px-2'>
          <button
            className="cta-button"
            disabled={!ctx.isClientMoveAllowed || board % 2 === 1}
            onClick={() => moves.halve(board)}
            onMouseEnter={() => setHoveredAction('halve')}
            onMouseLeave={() => setHoveredAction(null)}
          >{t({ hu: 'Elveszem a felét', en: 'Take half' })}</button>
        </span>
      </div>
    </section>
  );
};

const moves = {
  take1: (board, { events }) => {
    events.endTurn();
    if (board === 1) {
      events.endGame();
    }
    return { nextBoard: board - 1 }
  },
  halve: (board, { events }) => {
    events.endTurn();
    return { nextBoard: board / 2 };
  }
};

const aiBotStrategy = ({ board, moves }) => {
  if (board !== 4 && board % 4 === 0) {
    moves.take1(board);
  } else if (board === 6) {
    moves.take1(board);
  } else if (board % 2 === 0) {
    moves.halve(board);
  } else {
    moves.take1(board);
  }
};

const rule = {
  hu: <>
    Kezdetben van egy kupac zseton az asztalon. A soron lévő
    játékos elvehet egy zsetont a kupacból, vagy ha páros számú zseton van az asztalon, akkor elveheti a
    zsetonok felét. Az nyer, akinek a lépése után nem marad zseton az asztalon.
  </>,
  en: <>
    There is a pile of tokens on the table. On each turn the current player may remove one token,
    or — if the number of tokens is even — take half of them.
    The player whose move leaves no tokens on the table wins.
  </>
};

const getPlayerStepDescription = ({ board }) => {
  if (board % 2 === 1) {
    return { hu: 'Vegyél el egy zsetont.', en: 'Take one token.' };
  } else {
    return { hu: 'Egy zsetont vegyél el vagy felezz.', en: 'Take one token or take half.' };
  }
}

export const Take1OrHalve = strategyGameFactory({
  rule,
  metadata: gameList.Take1OrHalve,
  BoardClient,
  getPlayerStepDescription,
  moves,
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: () => random(20, 27) }]
});
