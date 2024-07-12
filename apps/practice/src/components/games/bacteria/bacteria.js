import React, { useState } from "react";
import { range, cloneDeep, random } from "lodash";
import { strategyGameFactory } from "../strategy-game";
import { getGameStateAfterAiTurn } from "./strategy";
import { isJump, reachedFieldsAfterClick, isAllowedAttackClick, areAllBacteriaRemoved } from "./helpers";

const boardWidth = 11;

const generateNewBoard = () => {
  const board = Array(9).fill([]);
  range(board.length).forEach((rowIndex) => {
    const rowSize = rowIndex % 2 === 0 ? boardWidth : boardWidth - 1;
    board[rowIndex] = Array(rowSize).fill(0);
  });

  const boardVariantId = random(1, 6);
  if (boardVariantId === 1) {
    [3, 4, 5, 6, 7].forEach(g => board[8][g] = -1);
    [2, 4, 6, 8].forEach(b => board[2][b] = 1);
  } else if (boardVariantId === 2) {
    [3, 4, 5, 6, 7].forEach(g => board[8][g] = -1);
    [3, 5, 7].forEach(b => board[2][b] = 1);
  } else if (boardVariantId === 3) {
    [0, 1, 2, 3, 4, 5].forEach(g => board[8][g] = -1);
    [1, 2, 3, 4].forEach(b => board[1][b] = 1);
  } else if (boardVariantId === 4) {
    [0, 1, 2, 3, 4, 5].forEach(g => board[8][g] = -1);
    [0, 1, 3].forEach(b => board[2][b] = 1);
  } else if (boardVariantId === 5) {
    range(0, 11).forEach(g => board[8][g] = -1);
    [2, 3, 7, 9].forEach(b => board[0][b] = 1);
  } else if (boardVariantId === 6) {
    range(0, 11).forEach(g => board[8][g] = -1);
    [1, 2, 4, 8].forEach(b => board[0][b] = 1);
  }

  return board;
};

const GameBoard = ({ board, ctx }) => {
  const [attackRow, setAttackRow] = useState(-1);
  const [attackCol, setAttackCol] = useState(-1);

  const newBoard = cloneDeep(board);
  const isPlayerAttacker = ctx.playerIndex === 0;

  const isAllowedAttack = ({ row, col }) => {
    if (board[row][col] === undefined) return false;
    return isAllowedAttackClick({ attackRow, attackCol, row, col });
  };

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

    const reachedFields = reachedFieldsAfterClick({
      board,
      attackRow,
      attackCol,
      row,
      col
    });

    const goalsReached = reachedFields.filter(([row, col]) => {
      board[row][col] === -1;
    });

    if (isJump({ attackRow, attackCol, row, col })) {
      newBoard[row][col] += 1;
      newBoard[attackRow][attackCol] -= 1;
    } else {
      newBoard[attackRow][attackCol] = 0;
      reachedFields.forEach(([row, col]) => {
        newBoard[row][col] += board[attackRow][attackCol];
      });
    }

    if (goalsReached.length >= 1) {
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
          {range(board.length).map((row) => (
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
    generateNewBoard,
    getGameStateAfterAiTurn
  }
});

export const Bacteria = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
