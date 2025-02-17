import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { random } from 'lodash';

const BoardClient = ({ board, ctx, moves }) => {
  return(
    <section className="p-2 shrink-0 grow basis-2/3">
      <p className='w-full text-8xl font-bold text-center'>{board}</p>
      <div className="flex flex-wrap">
        <span className="grow px-2">
          <button
            className='cta-button'
            disabled={!ctx.shouldRoleSelectorMoveNext}
            onClick={() => moves.take1(board)}
          >Elveszek egyet</button>
        </span>
        <span className='grow px-2'>
          <button
            className="cta-button"
            disabled={!ctx.shouldRoleSelectorMoveNext || board % 2 === 1}
            onClick={() => moves.halve(board)}
          >Elveszem a felét</button>
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

const rule = <>
  Kezdetben van egy kupac zseton az asztalon. A soron lévő
játékos elvehet egy zsetont a kupacból, vagy ha páros számú zseton van az asztalon, akkor elveheti a
zsetonok felét. Az nyer, akinek a lépése után nem marad zseton az asztalon.
</>;

const getPlayerStepDescription = ({ board }) => {
  if (board % 2 === 1) {
    return 'Vegyél el egy zsetont.'
  } else {
    return 'Egy zsetont vegyél el vagy felezz.'
  }
}

export const Take1OrHalve = strategyGameFactory({
  rule,
  title: 'Egyet vegyél vagy felezz',
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard: () => random(20, 27),
  aiBotStrategy,
  moves
});
