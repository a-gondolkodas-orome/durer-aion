import React from "react";
import { range, random, sample, difference, cloneDeep } from "lodash";
import { strategyGameFactory } from "../../game-factory/strategy-game";
import { neighbours } from "./helpers";
import { aiBotStrategy } from "./bot-strategy";
import { BoardClient } from "./board-client";
import { gameList } from "../gameList";

const generateStartBoardA = () => {
  const policeStartPosition = random(0, 7);
  const immediatePoliceWinPositions = [policeStartPosition, ...neighbours[policeStartPosition]];
  const thiefStartPosition = sample(difference(range(0, 8), immediatePoliceWinPositions));
  return {
    turnCount: 0,
    policemen: [policeStartPosition, policeStartPosition],
    thief: thiefStartPosition,
    firstPolicemanMoved: false
  };
};

const generateStartBoardB = () => {
  const policeStartPosition = [random(0, 7), random(0, 7)];
  const immediatePoliceWinPositions = [
    ...policeStartPosition,
    ...neighbours[policeStartPosition[0]],
    ...neighbours[policeStartPosition[1]]
  ];
  const thiefStartPositionOptions = difference(range(0, 8), immediatePoliceWinPositions);
  if (thiefStartPositionOptions.length === 0) {
    return generateStartBoardB();
  }
  const thiefStartPosition = sample(thiefStartPositionOptions);
  return {
    turnCount: 0,
    policemen: policeStartPosition,
    thief: thiefStartPosition,
    firstPolicemanMoved: false
  };
};

const moves = {
  moveThief: (board, { events }, vertex) => {
    const nextBoard = { ...cloneDeep(board), thief: vertex, turnCount: board.turnCount + 1 };
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame({ winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 });
    }
    return { nextBoard };
  },
  moveFirstPoliceman: (board, { events }, vertex) => {
    const nextBoard = cloneDeep(board);
    nextBoard.policemen[0] = vertex;
    nextBoard.firstPolicemanMoved = true;
    return { nextBoard };
  },
  moveSecondPoliceman: (board, { events }, vertex) => {
    const nextBoard = cloneDeep(board);
    nextBoard.policemen[1] = vertex;
    nextBoard.firstPolicemanMoved = false;
    events.endTurn();
    if (isGameEnd(nextBoard)) {
      events.endGame({ winnerIndex: hasFirstPlayerWon(nextBoard) ? 0 : 1 });
    }
    return { nextBoard };
  }
};

const isGameEnd = (board) => {
  if (board.turnCount === 3) {
    return true;
  } else if (board.thief === board.policemen[0] || board.thief === board.policemen[1]) {
    return true;
  }
  return false;
};

const hasFirstPlayerWon = (board) => {
  return board.turnCount < 4 && board.policemen.includes(board.thief);
};

const ruleA = {
  hu: <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket
    pöttyök jelölik. A játék kezdetén a számítógép az egyik útkereszteződésbe
    letesz egy tolvajt ábrázoló (piros) korongot, egy másikba pedig két
    rendőrt ábrázoló (kék illetve zöld) korongot. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd
    a tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet
    változtatnia. A rendőrök nyernek, ha a tolvaj
    bármikor azonos kereszteződésben van egy rendőrrel. A tolvaj nyer, ha a
    harmadik kör végéig nem kapták el.
  </>,
  en: <>
    The diagram shows a small town's road network, with intersections marked by dots. At the start,
    the computer places a thief (red) piece at one intersection and two policemen (blue and green)
    at another. Each round the policemen move first (blue then green), each stepping to an adjacent
    intersection along a road (they may split up), then the thief moves the same way. Everyone must
    move every round. The policemen win if the thief is ever at the same intersection as a policeman.
    The thief wins if they are not caught by the end of the third round.
  </>
};

const ruleB = {
  hu: <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket pöttyök
    jelölik. A játék kezdetén a számítógép valamely útkereszteződésekbe leteszi a tolvajt
    ábrázoló (piros), valamint a két rendőrt ábrázoló (kék illetve zöld) korongokat; a két rendőr
    esetleg ugyanarra a mezőre is kerülhet. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd a
    tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet változtatnia.
    A rendőrök nyernek, ha a rabló bármikor azonos kereszteződésben van egy rend-
    őrrel. A tolvaj nyer, ha a harmadik kör végéig nem kapták el.
  </>,
  en: <>
    The diagram shows a small town's road network, with intersections marked by dots. At the start,
    the computer places the thief (red) and the two policemen (blue and green) at intersections of
    their choosing; the two policemen may start on the same intersection. Each round the policemen
    move first (blue then green), each stepping to an adjacent intersection along a road (they may
    split up), then the thief moves the same way. Everyone must move every round. The policemen win
    if the thief is ever at the same intersection as a policeman. The thief wins if they are not
    caught by the end of the third round.
  </>
}

const { name: nameA, title: titleA } = gameList.Policemanthief;
export const PolicemanthiefA = strategyGameFactory({
  presentation: {
    rule: ruleA,
    title: titleA || nameA,
    credit: gameList.Policemanthief.credit,
    roleLabels: [
      { hu: "Rendőrök", en: "Policemen" },
      { hu: "Tolvaj", en: "Thief" }
    ],
    getPlayerStepDescription: ({ board, ctx }) => {
      if (ctx.currentPlayer === 0) {
        return {
          hu: `Kattints arra az útkereszteződésre, ahová a ` +
            `${board.firstPolicemanMoved ? "zöld" : "kék"} rendőrrel lépni szeretnél.`,
          en: `Click the intersection you want to move the ` +
            `${board.firstPolicemanMoved ? "green" : "blue"} policeman to.`
        };
      } else {
        return {
          hu: "Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.",
          en: "Click the intersection you want to move the thief to."
        };
      }
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: generateStartBoardA }]
});

const { name: nameB, title: titleB } = gameList.PolicemanthiefB;
export const PolicemanthiefB = strategyGameFactory({
  presentation: {
    rule: ruleB,
    title: titleB || nameB,
    credit: gameList.PolicemanthiefB.credit,
    roleLabels: [
      { hu: "Rendőrök", en: "Policemen" },
      { hu: "Tolvaj", en: "Thief" }
    ],
    getPlayerStepDescription: ({ board, ctx }) => {
      if (ctx.currentPlayer === 0) {
        return {
          hu: `Kattints arra az útkereszteződésre, ahová a ` +
            `${board.firstPolicemanMoved ? "zöld" : "kék"} rendőrrel lépni szeretnél.`,
          en: `Click the intersection you want to move the ` +
            `${board.firstPolicemanMoved ? "green" : "blue"} policeman to.`
        };
      } else {
        return {
          hu: "Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.",
          en: "Click the intersection you want to move the thief to."
        };
      }
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [{ botStrategy: aiBotStrategy, generateStartBoard: generateStartBoardB }]
});
