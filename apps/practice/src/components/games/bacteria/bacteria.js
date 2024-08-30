import React, { useState } from "react";
import { range, cloneDeep, random } from "lodash";
import { strategyGameFactory } from "../strategy-game";
import { getGameStateAfterAiTurn } from "./strategy";
import {
  isJump,
  reachedFieldsAfterClick,
  isAllowedAttackClick,
  areAllBacteriaRemoved,
  makeJump,
  makeShiftOrSpread,
  isDangerous
} from "./helpers";

const boardWidth = 11;

const generateStartBoard = () => {
  const bacteria = Array(9).fill([]);
  range(bacteria.length).forEach((rowIndex) => {
    const rowSize = rowIndex % 2 === 0 ? boardWidth : boardWidth - 1;
    bacteria[rowIndex] = Array(rowSize).fill(0);
  });

  // using isDangerous we could generate random but interesting boards instead of hardcoding a few
  const boardVariantId = random(1, 8);
  switch (boardVariantId) {
    case 1: {
      [2, 4, 6, 8].forEach(b => bacteria[2][b] = 1);
      return { bacteria, goals: [3, 4, 5, 6, 7] };
    }
    case 2: {
      [3, 5, 7].forEach(b => bacteria[2][b] = 1);
      return { bacteria, goals: [3, 4, 5, 6, 7] };
    }
    case 3: {
      [1, 2, 3, 4].forEach(b => bacteria[1][b] = 1);
      return { bacteria, goals: [0, 1, 2, 3, 4, 5] };
    }
    case 4: {
      [0, 1, 3].forEach(b => bacteria[2][b] = 1);
      return { bacteria, goals: [0, 1, 2, 3, 4, 5] };
    }
    case 5: {
      [2, 3, 7, 9].forEach(b => bacteria[0][b] = 1);
      return { bacteria, goals: range(0, 11) };
    }
    case 6: {
      [1, 2, 4, 8].forEach(b => bacteria[0][b] = 1);
      return { bacteria, goals: range(0, 11) };
    }
    case 7: {
      [5, 6, 7, 8].forEach(b => bacteria[1][b] = 1);
      return { bacteria, goals: [5, 6, 7, 8, 9, 10] };
    }
    case 8: {
      [7, 9, 10].forEach(b => bacteria[2][b] = 1);
      return { bacteria, goals: [5, 6, 7, 8, 9, 10] };
    }
  }
};

const GameBoard = ({ board: { bacteria, goals }, ctx }) => {
  const [attackRow, setAttackRow] = useState(null);
  const [attackCol, setAttackCol] = useState(null);

  const nextBoard = { bacteria: cloneDeep(bacteria), goals };
  const isPlayerAttacker = ctx.playerIndex === 0;

  const isAllowedAttack = ({ row, col }) => {
    if (bacteria[row][col] === undefined) return false;
    return isAllowedAttackClick({ attackRow, attackCol, row, col });
  };

  const isGoal = ({ row, col }) => row === (bacteria.length - 1) && goals.includes(col);

  const clickField = ({ row, col }) => {
    if (!ctx.shouldPlayerMoveNext) return;
    if (attackRow === null && !bacteria[row][col] >= 1) return;
    if (isPlayerAttacker && attackRow === row && attackCol === col) {
      setAttackRow(null);
      setAttackCol(null);
      return;
    }
    if (attackRow !== null && !isAllowedAttack({ row, col })) return;

    if (isPlayerAttacker && attackRow === null) {
      setAttackRow(row);
      setAttackCol(col);
      return;
    }


    if (!isPlayerAttacker) {
      nextBoard.bacteria[row][col] -= 1;
      if (areAllBacteriaRemoved(nextBoard.bacteria)) {
        ctx.endPlayerTurn({ nextBoard, isGameEnd: true, winnerIndex: 1 });
        return;
      }
      ctx.endPlayerTurn({ nextBoard, isGameEnd: false });
      return;
    }

    const reachedFields = reachedFieldsAfterClick({
      bacteria,
      attackRow,
      attackCol,
      row,
      col
    });

    const goalsReached = reachedFields.filter(([row, col]) => isGoal({ row, col }));

    if (isJump({ attackRow, attackCol, row, col })) {
      nextBoard.bacteria = makeJump(bacteria, attackRow, attackCol);
    } else {
      nextBoard.bacteria = makeShiftOrSpread(bacteria, attackRow, attackCol, reachedFields);
    }

    if (goalsReached.length >= 1) {
      ctx.endPlayerTurn({ nextBoard, isGameEnd: true, winnerIndex: 0 });
    } else {
      ctx.endPlayerTurn({ nextBoard, isGameEnd: false });
    }

    setAttackRow(null);
    setAttackCol(null);
  };

  const rowShift = row => row % 2 === 0 ? "0px" : `${100 / (2 * boardWidth)}%`;

  const cellLabel = ({ row, col }) => {
    if (isGoal({ row, col })) {
      return bacteria[row][col] ? `C: ${"B".repeat(bacteria[row][col])}` : "C";
    }
    if (!bacteria[row][col]) {
      return row % 2 === 1 && col === boardWidth - 1 ? "" : "-";
    }
    return "B".repeat(bacteria[row][col]);
  };

  const isForbidden = ({ row, col }) => {
    if (attackRow !== null && row === attackRow && col === attackCol) return false;
    if (attackRow !== null && !isAllowedAttack({ row, col })) return true;
    if (attackRow === null && bacteria[row][col] < 1) return true;
    return false;
  };

  const isDisabled = ({ row, col }) => (
    !ctx.shouldPlayerMoveNext
    || isForbidden({ row, col })
    || (row % 2 === 1 && col === (boardWidth - 1))
  );

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <table
        className="m-2 w-[95%] table-fixed"
        style={{ transform: "scaleY(-1)" }}
      >
        <tbody>
          {range(bacteria.length).map((row) => (
            <tr
              style={{ transform: `translateX(${rowShift(row)})`}}
              key={row}
            >
              {range(boardWidth).map((col) => (
                <td key={col} onClick={() => clickField({ row, col })}>
                  <button
                    disabled={isDisabled({ row, col })}
                    className={`
                      aspect-[4/3] w-full
                      ${row % 2 === 1 && col === boardWidth - 1 ? "" : "border-2"}
                      ${isGoal({ row, col }) ? "bg-blue-800" : ""}
                      ${isDangerous(nextBoard, { row, col }) ? "" : ""}
                      ${row === attackRow && col === attackCol ? "border-green-800": ""}
                      ${attackRow !== null && isAllowedAttack({ row, col }) ? "bg-teal-400" : ""}
                      ${isForbidden({ row, col }) ? "cursor-not-allowed" : ""}
                    `}
                    style={{ transform: "scaleY(-1)" }}
                  >
                    {cellLabel({ row, col })}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

const getPlayerStepDescription = (ctx) => {
  if (ctx.playerIndex === 0) {
    return "".concat(
      "Kattints egy mezőre, amin van baktérium és hajtsd végre ",
      "a három lehetséges támadás egyikét egy további szabályos kattintással."
    );
  } else {
    return "Kattints egy mezőre, amin van baktérium, hogy eltávolíts egy bakériumot onnan.";
  }
};

const rule = (
  <>
    A tábla B betűvel jelölt mezőin 1-1 baktérium található, a tábla
    felső sorában a kijelölt (szomszédos) mezők CÉL mezők. A játékban egy Támadó és Védekező
    játékos felváltva lép. A Védekező játékos minden körében levesz pontosan 1
    baktériumot bármely általa választott mezőről. Ez a baktérium lekerül a
    pályáról. A Támadó játékos a következő háromféle lépés egyikét választhatja:
    <br />
    1. Egy mezőn lévő összes baktériummal egyszerre balra vagy jobbra lép egyet.
    <br />
    2. Egyetlen baktériummal előre ugrik két sornyit.
    <br />
    3. Kijelöl egy mezőt, ahol végbemegy a sejtosztódás. Ekkor az ezen mezőn
    lévő összes baktérium osztódik: és mindegyikből egy-egy példány balra előre,
    ill. jobbra előre lép.
    <br />A Támadó akkor nyer, ha legalább egy baktérium bejut valamelyik CÉL
    mezőbe; a Védekező pedig akkor, ha az összes baktérium eltűnt a pályáról. Ha
    egy baktérium a pályán kívülre kerül egy lépéssel, akkor eltávolítottnak
    minősül. Te választhatod meg, hogy Támadó, vagy Védekező játékos szeretnél
    lenni. Sok sikert! :)
  </>
);

const Game = strategyGameFactory({
  rule,
  title: "Baktérimok terjedése",
  firstRoleLabel: "Támadó leszek",
  secondRoleLabel: "Védekező leszek",
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateStartBoard,
    getGameStateAfterAiTurn
  }
});

export const Bacteria = () => {
  const [board, setBoard] = useState(generateStartBoard());

  return <Game board={board} setBoard={setBoard} />;
};
