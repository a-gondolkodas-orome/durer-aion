import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, cloneDeep, sample, random } from 'lodash';
import { strategyDict } from './bot-strategy';

const isAllowed = (board, n) => {
  if (board.previousMove === null) {
    return true;
  }
  if (board.numbersOnTable[n - 1] === false) return false;
  if (board.previousMove > n && board.previousMove % n === 0) {
    return true;
  } else if (board.previousMove < n && n % board.previousMove === 0) {
    return true;
  }
  return false;
}

const BoardClient = ({ board, ctx, moves }) => {
  const isMoveAllowed = n => isAllowed(board, n);

  const removeNumber = n => {
    if (!ctx.shouldRoleSelectorMoveNext) return;
    if (!isMoveAllowed(n)) return;
    moves.removeNumber(board, n);
  }

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <p className = "text-2xl">
        A mostani játékban n={board.numbersOnTable.length}
      </p>
      <p className = "text-2xl">
        Az előző lépés: {board.previousMove === null ? "-" : board.previousMove}
      </p>
      <div>
        {range(1, board.numbersOnTable.length + 1).map(num =>
          <button
            key={num}
            disabled={!isMoveAllowed(num) || !ctx.shouldRoleSelectorMoveNext}
            onClick={() => removeNumber(num)}
            className={`
              m-1 min-h-28 w-18
              border-4 shadow-md rounded-xl text-4xl
              text-center font-bold
              ${board.numbersOnTable[num - 1] ? '' : 'opacity-50 border-gray-600 text-gray-600'}
              ${board.numbersOnTable[num - 1] ? (isMoveAllowed(num) ? 'border-green-600' : 'border-red-600') : ''}
              enabled:hover:bg-green-600 enabled:focus:bg-green-600
            `}
          >
            {num}
          </button>
        )}
      </div>
    </section>
  )
};

const moves = {
  removeNumber: (board, { events }, n) => {
    const nextBoard = cloneDeep(board);
    nextBoard.numbersOnTable[n - 1] = false;
    nextBoard.previousMove = n;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame();
    }
    return { nextBoard };
  }
};

const isGameEnd = board => {
  const possibleMoves = range(board.numbersOnTable.length)
    .filter(n => isAllowed(board, n + 1));
  return possibleMoves.length === 0;
}

const aiBotStrategy = ({ board, ctx, moves }) => {
  const numCount = board.numbersOnTable.length;
  const stateId = generateStateID(board);
  const optimalMoves = strategyDict[numCount]
    ? strategyDict[numCount][stateId]
    : [];
  if (optimalMoves.length) {
    moves.removeNumber(board, sample(optimalMoves));
  } else {
    const possibleMoves = range(numCount)
      .filter(n => isAllowed(board, n + 1))
      .map(x => x + 1);
    moves.removeNumber(board, sample(possibleMoves));
  }
};

const generateStateID = (board) => {
  let id = 0;
  for (let i = 0; i < board.numbersOnTable.length; i++) {
    if (board.numbersOnTable[i]){
      id += 2**(i)
    }
  }
  return (board.previousMove === null ? '-1' : board.previousMove) + "_" +id;
}

const rule = <>
  Egy táblára az <i>1</i>, <i>2</i>, <i>...</i>, <i>n</i> számok (<i>n &#8804; 15</i>)
  vannak felírva. Két játékos játszik, felváltva lépnek. A kezdőjátékos az első
  lépésében kiválaszt egy tetszőleges számot a tábláról és letörli azt. Ezután
  minden lépésben egy olyan számot kell letörölni, ami az előző (másik játékos
  által letörölt) számnak osztója vagy többszöröse. Az veszít, aki nem tud lépni.
</>;

const getPlayerStepDescription = () =>
  'Válassz egyet a letörölhető számok közül.';

const generateStartBoard = () => {
  const numCount = random(0, 2) === 0
    ? sample([6, 10])
    : sample([7, 8, 9, 11, 12, 13, 14, 15]);
  return ({
    numbersOnTable: Array(numCount).fill(true),
    previousMove: null
  })
}

export const RemoveDivisorMultiple = strategyGameFactory({
  rule,
  title: 'Osztó/Többszörös Törlés',
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  aiBotStrategy,
  moves
});
