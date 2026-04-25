import React from 'react';
import { strategyGameFactory } from '../../../game-factory/strategy-game';
import { range, cloneDeep } from 'lodash';
import { aiBotStrategy } from './bot-strategy';
import {
  hasWinningTriple,
  Sheriff,
  Thief,
  getUntakenCards,
  generateStartBoard
} from "../helpers";
import { gameList } from '../../gameList';

const CARD_COUNT = 7;

const BoardClient = ({ board, ctx, moves }) => {
  const isAllowedMove = index => {
    if (!ctx.isClientMoveAllowed) return false;
    return getUntakenCards(board, CARD_COUNT).includes(index);
  }

  const clickCard = (index) => {
    if (!isAllowedMove(index)) return;
    moves.takeCard(board, [index]);
  }

  const getCardColor = num => {
    if (board.cards[Thief].includes(num)) return 'bg-red-600';
    if (board.cards[Sheriff].includes(num)) return 'bg-blue-600';
    return 'bg-white';
  }

  return(
    <section className="p-2 shrink-0 grow basis-2/3">
      <div>
        {range(1, CARD_COUNT + 1).map(num =>
        <button
          key={num}
          disabled={!isAllowedMove(num)}
          onClick={() => clickCard(num)}
          className={`
            m-1 min-h-28 w-18
            border-2 shadow-md border-slate-800 rounded-xl text-4xl
            text-center font-bold
            ${ctx.currentPlayer === Thief
              ? "enabled:hover:bg-red-400 enabled:focus:bg-red-400"
              : "enabled:hover:bg-blue-400 enabled:focus:bg-blue-400"
            }
            ${getCardColor(num)}
          `}
        >
          {num}
        </button>)}
      </div>
    </section>
    );
};

const moves = {
  takeCard: (board, { ctx, events }, indices) => {
    const nextBoard = cloneDeep(board);

    indices.forEach(idx => {
      nextBoard.cards[ctx.currentPlayer].push(idx)
    });
    nextBoard.numTurns += 1;
    if (nextBoard.numTurns >= 5) {
      nextBoard.cards[Thief].push(...getUntakenCards(nextBoard, CARD_COUNT));
      const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
      events.endGame({ winnerIndex: winner });
    }
    events.endTurn();
    return { nextBoard };
  }
}

const rule = {
  hu: <>
    <b>Nyomozó és Tolvaj</b> az alábbi játékot játssza. Hét kártya van az asztalon lévő készletben,
    az 1, 2, ..., {CARD_COUNT} számokkal jelölve. A játék {CARD_COUNT} lépésből áll, minden lépésben az egyik
    játékos kezébe vesz egyet az asztalon lévő kártyák
    közül. Az alábbi sorrend szerint lépnek a játékosok:
    <br />
    <b>
    1. Nyomozó, 2. Tolvaj, 3. Nyomozó, 4. Tolvaj, 5. Nyomozó, 6. Tolvaj, 7. Tolvaj.
    </b>
    <br />
    Tolvaj akkor nyer, ha a játék végéig összegyűjt három olyan kártyát, melyek közül az egyiken lévő szám a másik
    kettőnek az átlaga. Nyomozó pedig akkor nyer, ha Tolvaj nem gyűjt össze három ilyen kártyát.
  </>,
  en: <>
    <b>Sheriff and Thief</b> play the following game. Seven cards numbered 1, 2, …, {CARD_COUNT} are on
    the table. The game lasts {CARD_COUNT} turns; on each turn one player picks up a card.
    The turn order is:
    <br />
    <b>
    1. Sheriff, 2. Thief, 3. Sheriff, 4. Thief, 5. Sheriff, 6. Thief, 7. Thief.
    </b>
    <br />
    The Thief wins if they collect three cards where one number is the average of the other two.
    The Sheriff wins if the Thief fails to collect such a triple.
  </>
};

export const ThievesMean7 = strategyGameFactory({
  rule,
  metadata: gameList.ThievesMean,
  BoardClient,
  getPlayerStepDescription: () => ({ hu: 'Válassz egy kártyát.', en: 'Pick a card.' }),
  roleLabels: [
    { hu: 'Nyomozó', en: "Sheriff" },
    { hu: 'Tolvaj', en: "Thief" }
  ],
  moves,
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard }]
});
