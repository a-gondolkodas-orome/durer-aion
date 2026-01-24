import React from "react";
import { range, random, sample, difference, cloneDeep } from "lodash";
import { strategyGameFactory } from "../strategy-game";
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

const ruleA = (
  <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket
    pöttyök jelölik. A játék kezdetén a szervezők az egyik útkereszteződésbe
    letesznek egy tolvajt ábrázoló (piros) korongot, egy másikba pedig két
    rendőrt ábrázoló (kék illetve zöld) korongot. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd
    a tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet
    változtatnia. A rendőrök nyernek, ha a tolvaj
    bármikor azonos kereszteződésben van egy rendőrrel. A tolvaj nyer, ha a
    harmadik kör végéig nem kapták el.
  </>
);

const ruleB = (
  <>
    Az ábrán egy kisváros úthálózata látható, ahol az útkereszteződéseket pöttyök
    jelölik. A játék kezdetén a szervezők valamely útkereszteződésekbe leteszik a tolvajt
    ábrázoló (piros), valamint a két rendőrt ábrázoló (kék illetve zöld) korongokat; a két rendőr
    esetleg ugyanarra a mezőre is kerülhet. Egy körben előbb a rendőrök (a kék majd a zöld) mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd a
    tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet változtatnia.
    A rendőrök nyernek, ha a rabló bármikor azonos kereszteződésben van egy rend-
    őrrel. A tolvaj nyer, ha a harmadik kör végéig nem kapták el.
  </>
)

export const PolicemanthiefA = strategyGameFactory({
  rule: ruleA,
  metadata: gameList.Policemanthief,
  roleLabels: ["Rendőrök", "Tolvaj"],
  BoardClient,
  getPlayerStepDescription: ({ board, ctx }) => {
    if (ctx.chosenRoleIndex === 0) {
      return `Kattints arra az útkereszteződésre, ahová a ${board.firstPolicemanMoved ? "zöld" : "kék"} rendőrrel lépni szeretnél.`;
    } else {
      return "Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.";
    }
  },
  generateStartBoard: generateStartBoardA,
  aiBotStrategy,
  moves
});

export const PolicemanthiefB = strategyGameFactory({
  rule: ruleB,
  metadata: gameList.PolicemanthiefB,
  roleLabels: ["Rendőrök", "Tolvaj"],
  BoardClient,
  getPlayerStepDescription: ({ board, ctx }) => {
    if (ctx.chosenRoleIndex === 0) {
      return `Kattints arra az útkereszteződésre, ahová a ${board.firstPolicemanMoved ? "zöld" : "kék"} rendőrrel lépni szeretnél.`;
    } else {
      return "Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.";
    }
  },
  generateStartBoard: generateStartBoardB,
  aiBotStrategy,
  moves
});
