import React from 'react';
import { strategyGameFactory } from '../strategy-game';
import { range, cloneDeep } from 'lodash';
import { aiBotStrategy } from './bot-strategy';

const BoardClient = ({ board, ctx, moves }) => {
  const isAllowedMove = index => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    return isAllowedBank(index);
  }

  const isAllowedBank = index => {
    return !board.thiefCards.includes(index) && !board.sheriffCards.includes(index)
  }

  const clickCard = (index) => {
    if (!isAllowedMove(index)) return;
    moves.takeCard(board, [index]);
  }

  const getCardColor = index => {
    if (board.thiefCards.includes(index + 1)) return "#fc031c";
    if (board.sheriffCards.includes(index + 1)) return "#0307fc";
    return "#1cfc03";
  }

  return(
    <section className="p-2 shrink-0 grow basis-2/3">
        <svg width="100%" height="100%" viewBox='0 0 100 100'>
            {range(7).map(i => {
            const num = i + 1;
            const row = Math.floor(i / 4);
            const col = i % 4;
            const x = 5 + col * 21;
            const y = 15 + row * 30;

            return (
                <g key={num}>
                <rect
                    x={`${x}%`}
                    y={`${y}%`}
                    width="18%"
                    height="25%"
                    fill={`${getCardColor(i)}`}
                    stroke="#1e40af"
                    strokeWidth="0.5%"
                    rx="3"
                    onClick={() => clickCard(i + 1)}
                />
                <text
                    x={`${x + 9}%`}
                    y={`${y + 12.5}%`}
                    textAnchor="middle"
                    fill="white"
                    fontSize="30%"
                    fontWeight="bold"
                >
                    {num}
                </text>
                </g>
            );
            })}
        </svg>
    </section>
    );
};

const moves = {
  takeCard: (board, { ctx, events }, indices) => {
    const nextBoard = cloneDeep(board);

    indices.forEach(idx => {
      // console.log(idx)
      if (ctx.currentPlayer === 0) {
        nextBoard.sheriffCards.push(idx);
      }
      else {
        nextBoard.thiefCards.push(idx);
      }
    });
    nextBoard.numTurns += 1;
    if (nextBoard.numTurns >= 5) {
      findLastTwo(nextBoard).forEach(idx => {
        if (ctx.currentPlayer === 1) {
          nextBoard.sheriffCards.push(idx);
        }
        else {
          nextBoard.thiefCards.push(idx);
        }
      });
      const winner = getWinner(nextBoard.thiefCards);
      console.log('winner', winner, "chosenRoleIndex", ctx.chosenRoleIndex);
      events.endGame({ winnerIndex: winner });
    }
    events.endTurn();
    return { nextBoard };
  }
}

function findLastTwo(board) {
  let ret = []
  for (let i = 1; i <= 7; i++) {
    if (board.thiefCards.includes(i) || board.sheriffCards.includes(i)) continue;
    ret.push(i);
  }
  if (ret.length > 2) {
      console.error("Too many cards found after start", ret);
      return [ret[0], ret[1]];
    }
  return ret;
}

const rule = <>
    <b>Nyomozó és Tolvaj</b> az alábbi játékot játssza. Hét kártya van az asztalon lévő készletben,
    az 1, 2, ..., 7 számokkal jelölve. A játék 7 lépésből áll, minden lépésben az egyik
    játékos kezébe vesz egyet az asztalon lévő kártyák
    közül. Az alábbi sorrend szerint lépnek a játékosok:
    <br></br><b>
    1. Nyomozó, 2. Tolvaj, 3. Nyomozó, 4. Tolvaj, 5. Nyomozó, 6. Tolvaj, 7. Tolvaj.
    </b><br></br>
    Tolvaj akkor nyer, ha a játék végéig összegyűjt három olyan kártyát, melyek közül az egyiken lévő szám a másik
    kettőnek az átlaga. Nyomozó pedig akkor nyer, ha Tolvaj nem gyűjt össze három ilyen kártyát.
    <br></br>
</>;

const generateStartBoard = () => {
  return {
    thiefCards: [],
    sheriffCards: [],
    numTurns: 0
  };
}

function getWinner(thiefCards) {
  const thiefCardsSort = thiefCards.slice().sort((a, b) => a - b);
  for (let a = 0; a <= 2; a++) {
    for (let b = a + 1; b <= 2; b++) {
      for (let c = b + 1; c <= 3; c++) {
        const valA = thiefCardsSort[a];
        const valB = thiefCardsSort[b];
        const valC = thiefCardsSort[c];
        if (valA + valC === 2 * valB) {
          return 1;
        }
      }
    }
  }
  return 0;
}

export const ThievesMean = strategyGameFactory({
  rule,
  title: 'Tolvajnál átlag',
  BoardClient,
  getPlayerStepDescription: () => 'Válassz egy kártyát',
  generateStartBoard,
  moves,
  aiBotStrategy
});
