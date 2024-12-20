import React from "react";
import { range, random, sample, difference, cloneDeep } from "lodash";
import { strategyGameFactory } from "../strategy-game";
import { neighbours } from "./helpers";
import { aiBotStrategy } from "./bot-strategy";
import { BoardClient } from "./board-client";

const generateStartBoard = () => {
  const policeStartPosition = random(0, 7);
  const immediatePoliceWinPositions = [policeStartPosition, ...neighbours[policeStartPosition]];
  const thiefStartPosition = sample(difference(range(0, 8), immediatePoliceWinPositions));
  return {
    turnCount: 0,
    policemen: [policeStartPosition, policeStartPosition],
    thief: thiefStartPosition
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
    events.setTurnStage("secondMove");
    return { nextBoard };
  },
  moveSecondPoliceman: (board, { events }, vertex) => {
    const nextBoard = cloneDeep(board);
    nextBoard.policemen[1] = vertex;
    events.setTurnStage(null);
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

const rule = (
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

export const Policemanthief = strategyGameFactory({
  rule,
  title: "Rendőr-tolvaj",
  roleLabels: ["Rendőrök", "Tolvaj"],
  BoardClient,
  getPlayerStepDescription: ({ ctx }) => {
    if (ctx.chosenRoleIndex === 0) {
      return `Kattints arra az útkereszteződésre, ahová a ${ctx.turnStage === "secondMove" ? "zöld" : "kék"} rendőrrel lépni szeretnél.`;
    } else {
      return "Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.";
    }
  },
  generateStartBoard,
  aiBotStrategy,
  moves
});
