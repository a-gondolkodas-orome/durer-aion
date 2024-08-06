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
  const [firstMovedPoliceman, setFirstMovedPoliceman] = useState(null);
  const [turnStage, setTurnStage] = useState("choose");

  const handleCircleClick = (vertex) => {
    if (!isClickable(vertex)) return;
    if (ctx.playerIndex === 1) {
      const nextBoard = { ...board, thief: vertex, turnCount: board.turnCount + 1 };
      ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
      return;
    }
    if (turnStage === "choose") {
      setTurnStage(vertex === board.policemen[0] ? "move0" : "move1");
      return;
    }
    const nextBoard = { ...board }
    if (turnStage === "move0") {
      nextBoard.policemen[0] = vertex;
      setFirstMovedPoliceman(0);
    }
    if (turnStage === "move1") {
      nextBoard.policemen[1] = vertex;
      setFirstMovedPoliceman(1);
    }
    setBoard(nextBoard);
    setTurnStage("choose");

    const isMoveOfPoliceman0AsSecond = (firstMovedPoliceman === 1 && turnStage === "move0");
    const isMoveOfPoliceman1AsSecond = (firstMovedPoliceman === 0 && turnStage === "move1");
    if (isMoveOfPoliceman0AsSecond || isMoveOfPoliceman1AsSecond) {
      nextBoard.turnCount++;
      setFirstMovedPoliceman(null);
      ctx.endPlayerTurn(getGameStateAfterMove(nextBoard));
    }
  };

  const isClickable = (vertex) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (ctx.playerIndex === 1) {
      return neighbours[board.thief].includes(vertex);
    }
    if (turnStage === "choose") {
      if (firstMovedPoliceman === 0) return vertex === board.policemen[1];
      if (firstMovedPoliceman === 1) return vertex === board.policemen[0];
      return board.policemen.includes(vertex);
    }
    if (turnStage === "move0") {
      return neighbours[board.policemen[0]].includes(vertex)
    }
    if (turnStage === "move1") {
      return neighbours[board.policemen[1]].includes(vertex)
    }
    return false;
  }

  const getColor = (vertex) => {
    if (board.thief === vertex) return "red";
    if (board.policemen.includes(vertex)) return "blue";
    return "white";
  };

  const toBeChosenToMove = (vertex) => {
    return isClickable(vertex) && ctx.playerIndex === 0 && turnStage === "choose";
  };

  const isDuringMove = (vertex) => {
    if (!ctx.shouldPlayerMoveNext) return false;
    if (ctx.playerIndex !== 0) return false;
    if (board.policemen[0] === vertex && turnStage === "move0") return true;
    if (board.policemen[1] === vertex && turnStage === "move1") return true;
    return false;
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <svg className="aspect-square stroke-black stroke-[3]">
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
              className={isDuringMove(vertex) && board.policemen[0] !== board.policemen[1] ? "opacity-50" : undefined}
              r="4%"
              stroke={toBeChosenToMove(vertex) ? "orange" : ""}
              fill={getColor(vertex)}
              onClick={() => handleCircleClick(vertex)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') handleCircleClick(vertex);
              }}
              tabIndex={isClickable(vertex) ? 0 : 'none'}
            />
            {vertex === board.policemen[0] && vertex === board.policemen[1] && (
              <text
                style={{ transform: "translate(-1%,1%)" }}
                x={cubeCoords[vertex].cx}
                y={cubeCoords[vertex].cy}
                onClick={() => handleCircleClick(vertex)}
              >
                2x
              </text>
            )}
            {vertex === board.thief && (vertex === board.policemen[0] || vertex === board.policemen[1]) && (
              <text
                style={{ transform: "translate(-2%,1%)" }}
                x={cubeCoords[vertex].cx}
                y={cubeCoords[vertex].cy}
              >
                T+R
              </text>
            )}
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
    rendőrt ábrázoló (kék) korongot. Egy körben előbb a rendőrök mennek át
    egy-egy szomszédos útkereszteződésbe egy út mentén (szét is válhatnak), majd
    a tolvaj is hasonlóan lép. Minden körben kötelező mindenkinek helyet
    változtatnia, és a két rendőr különválhat. A rendőrök nyernek, ha a tolvaj
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
    getPlayerStepDescription: ({ playerIndex }) => {
      if (playerIndex === 0) {
        return "Kattints először az egyik rendőrre, majd arra az útkereszteződésre, ahová lépni szeretnél vele, majd hasonlóan a másik rendőrrel.";
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
