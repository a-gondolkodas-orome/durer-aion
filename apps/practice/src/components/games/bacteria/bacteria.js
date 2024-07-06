import React, { useState } from "react";
import { range, sampleSize, cloneDeep, random } from "lodash";
import { strategyGameFactory } from "../strategy-game";
import { getGameStateAfterAiTurn } from "./strategy/strategy";

const boardWidth = 11;
const boardHeight = 9;
const adjGoals = true;

const generateNewBoard = () => {
  const board = Array(boardHeight).fill([]);
  range(boardHeight).forEach((rowIndex) => {
    const rowSize = rowIndex % 2 === 0 ? boardWidth : boardWidth - 1;
    board[rowIndex] = Array(rowSize).fill(0);
  });

  const numOfGoals = random(1, boardWidth);
  if (adjGoals) {
    const goalStart = random(boardWidth - numOfGoals);
    for (let i = goalStart; i < goalStart + numOfGoals; i++) {
      board[boardHeight - 1][i] = -1;
    }
  } else {
    const goals = sampleSize(range(boardWidth), numOfGoals);
    goals.forEach((index) => (board[8][index] = -1));
  }

  const numOfBacteria = random(1, boardWidth - 1);
  const bacteria = sampleSize(range(boardWidth), numOfBacteria);
  bacteria.forEach((index) => (board[0][index] = 1));

  return board;
};

const GameBoard = ({ board, ctx }) => {
  const [attackRow, setAttackRow] = useState(-1);
  const [attackCol, setAttackCol] = useState(-1);

  const newBoard = cloneDeep(board);
  const isPlayerAttacker = ctx.playerIndex === 0;

  const areAllBacteriaRemoved = (newBoard) => {
    for (let row = 0; row < boardHeight; row++) {
      for (let col = 0; col < boardWidth - 0.5 - 0.5 * (-1) ** row; col++) {
        if (newBoard[row][col] > 0) return false;
      }
    }
    return true;
  };

  const isShift = ({ row, col }) => {
    return attackRow === row && Math.abs(attackCol - col) === 1;
  };

  const isSpread = ({ row, col }) => {
    return (
      row === attackRow + 1 &&
      (col === attackCol || col === attackCol + (-1) ** (1 + attackRow))
    );
  };

  const isJump = ({ row, col }) => {
    return row === attackRow + 2 && col === attackCol;
  };

  const isAllowedAttack = ({ row, col }) => {
    return isShift({ row, col }) || isSpread({ row, col }) || isJump({ row, col });
  }

  const clickField = ({ row, col }) => {
    if (!ctx.shouldPlayerMoveNext) return;
    if (attackRow === -1 && board[row][col] < 1) return;
    if (attackRow !== -1 && !isAllowedAttack({ row, col })) return;

    if (isPlayerAttacker && attackRow === -1) {
      setAttackRow(row);
      setAttackCol(col);
      return;
    }

    if (!isPlayerAttacker) {
      newBoard[row][col] -= 1;
      if (areAllBacteriaRemoved(newBoard)) {
        ctx.endPlayerTurn({ newBoard, isGameEnd: true, winnerIndex: 1 });
        return;
      }
      ctx.endPlayerTurn({ newBoard, isGameEnd: false });
      return;
    }

    if (isJump({ row, col })) {
      newBoard[row][col] += 1;
      newBoard[attackRow][attackCol] -= 1;
    } else {
      newBoard[row][col] += board[attackRow][attackCol];
      newBoard[attackRow][attackCol] = 0;

      const spreadInBoard =
        attackRow % 2 === 1 ||
        (attackCol >= 1 && attackCol <= boardWidth - 2);
      if (isSpread({ row, col }) && spreadInBoard) {
        if (attackCol === col) {
          newBoard[row][col + (-1) ** row] += board[attackRow][attackCol];
        } else {
          newBoard[row][attackCol] += board[attackRow][attackCol];
        }
      }
    }

    const goalReached =
      board[row][col] === -1 ||
      (attackCol === col && board[row][col + (-1) ** row] === -1) ||
      (attackCol !== col && board[row][attackCol] === -1);

    if (goalReached) {
      ctx.endPlayerTurn({ newBoard, isGameEnd: true, winnerIndex: 0 });
    } else {
      ctx.endPlayerTurn({ newBoard, isGameEnd: false });
    }

    setAttackRow(-1);
    setAttackCol(-1);
  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <table
        className="m-2 w-[95%] table-fixed"
        style={{ transform: "scaleY(-1)" }}
      >
        <tbody>
          {range(boardHeight).map((row) => (
            <tr
              style={{
                transform: `translateX(${
                  row % 2 === 0 ? "0px" : `${100 / (2 * boardWidth)}%`
                })`
              }}
              key={row}
            >
              {range(boardWidth).map((col) => (
                <td key={col} onClick={() => clickField({ row, col })}>
                  <button
                    className={`
                      aspect-square w-full ${
                        row % 2 === 1 && col === boardWidth - 1
                          ? ""
                          : "border-2"
                      }
                      ${board[row][col] < 0 ? "bg-blue-800" : ""}
                      ${
                        row === attackRow && col === attackCol
                          ? "border-green-800"
                          : ""
                      }
                      ${attackRow !== -1 && isAllowedAttack({ row, col }) ? "bg-teal-400" : ""}
                      ${attackRow !== -1 && !isAllowedAttack({ row, col }) ? "cursor-not-allowed" : ""}
                      ${attackRow === -1 && board[row][col] < 1 ? "cursor-not-allowed" : ""}
                    `}
                    style={{ transform: "scaleY(-1)" }}
                  >
                    {board[row][col] < 0
                      ? "C"
                      : board[row][col]
                      ? "B".repeat(board[row][col])
                      : row % 2 === 1 && col === boardWidth - 1
                      ? ""
                      : "-"}
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
    A tábla alsó sorában a kijelölt mezőkön 1-1 baktérium található, a tábla
    felső sorában a kijelölt mezők CÉL mezők. A játékban egy Támadó és Védekező
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
    generateNewBoard,
    getGameStateAfterAiTurn
  }
});

export const Bacteria = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
