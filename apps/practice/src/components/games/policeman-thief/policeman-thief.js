import React, { Fragment, useState } from "react";
import { range, random, sample, difference } from "lodash";
import { strategyGameFactory } from "../strategy-game";
import { neighbours, getGameStateAfterAiTurn, getGameStateAfterMove } from "./strategy";

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

const cubeCoords = [
  { cx: "30%", cy: "30%" },
  { cx: "30%", cy: "70%" },
  { cx: "70%", cy: "30%" },
  { cx: "70%", cy: "70%" },
  { cx: "10%", cy: "10%" },
  { cx: "10%", cy: "90%" },
  { cx: "90%", cy: "10%" },
  { cx: "90%", cy: "90%" }
];

const GameBoard = ({ board, setBoard, ctx }) => {
  const handleCircleClick = (vertex) => {
    if (!isClickable(vertex)) return;
    if (ctx.playerIndex === 1) {
      const nextBoard = { ...board, thief: vertex, turnCount: board.turnCount + 1 };
      ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
      return;
    }
    const nextBoard = { ...board }
    if (ctx.turnStage === "greenMove") {
      nextBoard.policemen[1] = vertex;
      nextBoard.turnCount++;
      ctx.setTurnStage("move")
      ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
      return;
    }
    nextBoard.policemen[0] = vertex;
    ctx.setTurnStage("greenMove")
    setBoard(nextBoard);
  };

  const isClickable = (vertex) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (ctx.playerIndex === 1) {
      return neighbours[board.thief].includes(vertex);
    }
    if (ctx.turnStage === "greenMove") {
      return neighbours[board.policemen[1]].includes(vertex)
    }
    return neighbours[board.policemen[0]].includes(vertex)
  }

  const getColor = (vertex) => {
    if (isClickable(vertex)) {
      if (ctx.playerIndex === 1) {
        if (board.policemen[0] === vertex) return "url(#thief-and-blue-policeman)";
        if (board.policemen[1] === vertex) return "url(#thief-and-green-policeman)";
        return "red";
      }
      if (ctx.playerIndex === 0) {
        if (ctx.turnStage === "greenMove") {
          if (board.thief === vertex) return "url(#thief-and-green-policeman)";
          if (board.policemen[0] === vertex) return "url(#2policemen)";
          return "green";
        }
        if (board.thief === vertex) return "url(#thief-and-blue-policeman)";
        if (board.policemen[1] === vertex) return "url(#2policemen)";
        return "blue";
      }
    }
    if (board.thief === vertex && board.policemen[0] === vertex) return "url(#thief-and-blue-policeman)";
    if (board.thief === vertex && board.policemen[1] === vertex) return "url(#thief-and-green-policeman)";
    if (board.thief === vertex) return "red";
    if (board.policemen[0] === vertex && board.policemen[1] === vertex) return "url(#2policemen)";
    if (board.policemen[0] === vertex) return "blue";
    if (board.policemen[1] === vertex) return "green";
    return "white";
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <svg className="aspect-square stroke-black stroke-[3]">
        <pattern id="2policemen" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect x="0" y="0" style={{ stroke: "blue", strokeWidth: 8 }} width="8" height="8"></rect>
          <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" style={{stroke:"green", strokeWidth:3}}></path>
        </pattern>
        <pattern id="thief-and-blue-policeman" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect x="0" y="0" style={{ stroke: "red", strokeWidth: 8 }} width="8" height="8"></rect>
          <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" style={{stroke:"blue", strokeWidth:3}}></path>
        </pattern>
        <pattern id="thief-and-green-policeman" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect x="0" y="0" style={{ stroke: "red", strokeWidth: 8 }} width="8" height="8"></rect>
          <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" style={{stroke:"green", strokeWidth:3}}></path>
        </pattern>
        <rect
          x="30%"
          y="30%"
          width="40%"
          height="40%"
          className="fill-transparent"
        />
        <rect
          x="10%"
          y="10%"
          width="80%"
          height="80%"
          className="fill-transparent"
        />

        <line x1="10%" y1="10%" x2="30%" y2="30%" />
        <line x1="90%" y1="90%" x2="70%" y2="70%" />
        <line x1="10%" y1="90%" x2="30%" y2="70%" />
        <line x1="90%" y1="10%" x2="70%" y2="30%" />

        {range(8).map((vertex) => (
          <Fragment key={vertex}>
            <circle
              cx={cubeCoords[vertex].cx}
              cy={cubeCoords[vertex].cy}
              r="4%"
              fill={getColor(vertex)}
              onClick={() => handleCircleClick(vertex)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') handleCircleClick(vertex);
              }}
              tabIndex={isClickable(vertex) ? 0 : 'none'}
              className={isClickable(vertex) ? 'opacity-50' : ''}
            />
          </Fragment>
        ))}
      </svg>
    </section>
  );
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

const Game = strategyGameFactory({
  rule,
  title: "Rendőr-tolvaj",
  firstRoleLabel: "Rendőrök",
  secondRoleLabel: "Tolvaj",
  GameBoard,
  G: {
    getPlayerStepDescription: ({ playerIndex, turnStage }) => {
      if (playerIndex === 0) {
        return `Kattints arra az útkereszteződésre, ahová a ${turnStage === "greenMove" ? "zöld" : "kék"} rendőrrel lépni szeretnél.`;
      } else {
        return "Kattints arra az útkereszteződésre, ahová a tolvajjal lépni szeretnél.";
      }
    },
    generateStartBoard,
    getGameStateAfterAiTurn
  }
});

export const Policemanthief = () => {
  const [board, setBoard] = useState(generateStartBoard());
  return <Game board={board} setBoard={setBoard} />;
};
