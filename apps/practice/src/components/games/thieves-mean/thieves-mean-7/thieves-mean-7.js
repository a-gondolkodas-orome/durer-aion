import React from 'react';
import { strategyGameFactory } from '../../strategy-game';
import { range, cloneDeep } from 'lodash';
import { aiBotStrategy } from './bot-strategy';
import {
  hasWinningTriple,
  Sheriff,
  Thief,
  getUntakenCards,
  generateStartBoard
} from "../helpers";

const CARD_COUNT = 7;

const BoardClient = ({ board, ctx, moves }) => {
  const isAllowedMove = index => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
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
    <section className="p-2 shrink-0 basis-2/3">
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
            ${ctx.chosenRoleIndex === Thief
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

const rule = <>
    <b>Nyomozó és Tolvaj</b> az alábbi játékot játssza. Hét kártya van az asztalon lévő készletben,
    az 1, 2, ..., {CARD_COUNT} számokkal jelölve. A játék {CARD_COUNT} lépésből áll, minden lépésben az egyik
    játékos kezébe vesz egyet az asztalon lévő kártyák
    közül. Az alábbi sorrend szerint lépnek a játékosok:
    <br></br>
    <b>
    1. Nyomozó, 2. Tolvaj, 3. Nyomozó, 4. Tolvaj, 5. Nyomozó, 6. Tolvaj, 7. Tolvaj.
    </b>
    <br></br>
    Tolvaj akkor nyer, ha a játék végéig összegyűjt három olyan kártyát, melyek közül az egyiken lévő szám a másik
    kettőnek az átlaga. Nyomozó pedig akkor nyer, ha Tolvaj nem gyűjt össze három ilyen kártyát.
    <br></br>
</>;

export const ThievesMean7 = strategyGameFactory({
  rule,
  title: `Tolvajnál átlag (1-${CARD_COUNT})`,
  BoardClient,
  getPlayerStepDescription: () => 'Válassz egy kártyát.',
  roleLabels: ['Nyomozó leszek', 'Tolvaj leszek'],
  generateStartBoard,
  moves,
  aiBotStrategy
});
