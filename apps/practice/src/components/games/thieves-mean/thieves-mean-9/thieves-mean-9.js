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

const CARD_COUNT = 9;

const BoardClient = ({ board, ctx, moves }) => {
  const isAllowedMove = index => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return getUntakenCards(board, CARD_COUNT).includes(index);
  }

  const clickCard = (index) => {
    if (!isAllowedMove(index)) return;
    moves.takeCard(board, index);
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
  takeCard: (board, { ctx, events }, idx) => {
    const nextBoard = cloneDeep(board);

    nextBoard.cards[ctx.currentPlayer].push(idx);
    nextBoard.numTurns += 1;

    if (nextBoard.numTurns === 8) {
      nextBoard.cards[Sheriff].push(getUntakenCards(nextBoard, CARD_COUNT)[0]);
      const winner = hasWinningTriple(nextBoard.cards[Thief]) ? Thief : Sheriff;
      events.endGame({ winnerIndex: winner });
    } else if (hasWinningTriple(nextBoard.cards[Thief])) {
      // Thief can win early
      events.endGame({ winnerIndex: Thief });
    }
    events.endTurn();
    return { nextBoard };
  }
}

const rule = <>
    <b>Nyomozó és Tolvaj</b> az alábbi játékot játssza. Kilenc kártya van az asztalon lévő készletben,
    az 1, 2, ..., {CARD_COUNT} számokkal jelölve. Nyomozó és Tolvaj felváltva vesz a kezébe egyet-egyet
    az asztalon lévő kártyák közül úgy, hogy az első kártyát Nyomozó veszi el.
    Tolvaj akkor nyer, ha a játék végéig összegyűjt három olyan kártyát, melyek közül az egyiken
lévő szám a másik kettőnek az átlaga. Nyomozó pedig akkor nyer, ha Tolvaj nem gyűjt össze
három ilyen kártyát.
    <br></br>
</>;

export const ThievesMean9 = strategyGameFactory({
  rule,
  title: `Tolvajnál átlag (1-${CARD_COUNT})`,
  BoardClient,
  getPlayerStepDescription: () => 'Válassz egy kártyát.',
  roleLabels: ['Nyomozó leszek', 'Tolvaj leszek'],
  generateStartBoard,
  moves,
  aiBotStrategy
});
