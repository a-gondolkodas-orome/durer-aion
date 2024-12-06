import React, { Fragment } from "react";
import { range, random, sample, difference, cloneDeep } from "lodash";
import { strategyGameFactory } from "../strategy-game";
import { neighbours } from "./helpers";
import { aiBotStrategy } from "./bot-strategy";

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

const BoardClient = ({ board, ctx, moves }) => {
  const handleCircleClick = (vertex) => {
    if (!isClickable(vertex)) return;
    if (ctx.chosenRoleIndex === 1) {
      moves.moveThief(vertex);
      return;
    }
    if (ctx.turnStage === "secondMove") {
      moves.moveSecondPoliceman(vertex);
      return;
    }
    moves.moveFirstPoliceman(vertex);
  };

  const isClickable = (vertex) => {
    if (!ctx.shouldRoleSelectorMoveNext) return false;
    if (ctx.chosenRoleIndex === 1) {
      return neighbours[board.thief].includes(vertex);
    }
    if (ctx.turnStage === "secondMove") {
      return neighbours[board.policemen[1]].includes(vertex)
    }
    return neighbours[board.policemen[0]].includes(vertex)
  }

  const getColor = (vertex) => {
    if (isClickable(vertex)) {
      if (ctx.chosenRoleIndex === 1) {
        if (board.policemen[0] === vertex) return "url(#thief-and-first-policeman)";
        if (board.policemen[1] === vertex) return "url(#thief-and-second-policeman)";
        return "red";
      }
      if (ctx.chosenRoleIndex === 0) {
        if (ctx.turnStage === "secondMove") {
          if (board.thief === vertex) return "url(#thief-and-second-policeman)";
          if (board.policemen[0] === vertex) return "url(#2policemen)";
          return "forestgreen";
        }
        if (board.thief === vertex) return "url(#thief-and-first-policeman)";
        if (board.policemen[1] === vertex) return "url(#2policemen)";
        return "navy";
      }
    }
    if (board.thief === vertex && board.policemen[0] === vertex) return "url(#thief-and-first-policeman)";
    if (board.thief === vertex && board.policemen[1] === vertex) return "url(#thief-and-second-policeman)";
    if (board.thief === vertex) return "red";
    if (board.policemen[0] === vertex && board.policemen[1] === vertex) return "url(#2policemen)";
    if (board.policemen[0] === vertex) return "navy";
    if (board.policemen[1] === vertex) return "forestgreen";
    return "white";
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <svg className="aspect-square stroke-black stroke-[3]">
        <pattern id="2policemen" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12">
          <rect x="0" y="0" fill="navy" stroke="navy" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "forestgreen", strokeWidth: "12" }} />
        </pattern>
        <pattern id="thief-and-first-policeman" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12">
          <rect x="0" y="0" fill="red" stroke="red" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "navy", strokeWidth: "12" }} />
        </pattern>
        <pattern id="thief-and-second-policeman" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)" width="12" height="12">
          <rect x="0" y="0" fill="red" stroke="red" width="12" height="12"></rect>
          <line x1="0" y1="0" x2="0" y2="12" style={{ stroke: "forestgreen", strokeWidth: "12" }} />
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
