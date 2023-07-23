import React, { useState } from 'react';
import { range, sampleSize, cloneDeep } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterAiTurn  } from './strategy/strategy';

const sizeOfBoard = 17;
const adjGoals = true;

const generateNewBoard = () => {
    const board = Array(9).fill([]);
    board.forEach((row, index) => board[index] = Array(sizeOfBoard - 0.5 - 0.5*((-1)**(1+ index))).fill(0));
    const numOfGoals = Math.ceil(Math.random()*sizeOfBoard);
    if (adjGoals) {
        const goalStart = Math.floor(Math.random()*(sizeOfBoard-numOfGoals));
        for (let i = goalStart; i<goalStart + numOfGoals; i++) {
            board[8][i] = -1;
        }
    } else {
        const indices = range(sizeOfBoard);
        const goals = sampleSize(indices,numOfGoals);
        goals.forEach(index => board[8][index] = -1);
    }
    const numOfBacteria = Math.ceil(Math.random()*sizeOfBoard);
    const indices = range(sizeOfBoard);
    const bacteria = sampleSize(indices,numOfBacteria);
    bacteria.forEach(index => board[0][index] = 1);
    return board;
};

const GameBoard = ({ board, setBoard, ctx }) => {
  let newBoard = cloneDeep(board);

  let [selected, setSelected] = useState(false);

  let [attackRow, setAttackRow] = useState(-1);
  let [attackCol, setAttackCol] = useState(-1);

  const emptyBoard = () => {
    for(let row = 0; row < 9; row++) {
        for(let col = 0; col < sizeOfBoard - 0.5 - 0.5*((-1)**row); col++) {
            if (newBoard[row][col] > 0) return false;
        }
    }
    return true;
  }

  const clickField = ({row, col}) => {
    const defend = ctx.playerIndex === 1, occupied = board[row][col] > 0;
    const shift = attackRow === row && Math.abs(attackCol-col) === 1;
    const spread = row === attackRow + 1 && (col === attackCol || col === attackCol + (-1)**(1+attackRow));
    const spreadInBoard = attackRow%2 === 1 || (attackCol - 1 >= 0 && attackCol <= sizeOfBoard-2);
    const spreadSame = attackCol === col;
    const jump = row === attackRow + 2 && col === attackCol;
    const attack = shift || spread || jump;
    const goalReached = board[row][col] === -1 || (spreadSame && board[row][col + (-1)**row] === -1 ||
                                                    !spreadSame && board[row][attackCol] === -1);
    let winnerIndex = -1;
    let endPlayerTurn = true;

    if (defend) {
      if (occupied) {
        newBoard[row][col] -= 1;
        if(emptyBoard()){
          winnerIndex = 1
        };
      } else {
        endPlayerTurn = false;
      }
    } else {
        if (selected) { if (attack) {
                if (shift || spread) {
                    newBoard[row][col] += board[attackRow][attackCol];
                    newBoard[attackRow][attackCol] = 0;
                    if (spread && spreadInBoard) {
                        if (spreadSame) {
                            newBoard[row][col + (-1)**row] += board[attackRow][attackCol];
                        } else {
                            newBoard[row][attackCol] += board[attackRow][attackCol];
                        }
                    }
                } else {
                    newBoard[row][col] += 1;
                    newBoard[attackRow][attackCol] -= 1;
                }
                if (goalReached) winnerIndex = 0;
                setSelected(false);
            } else {endPlayerTurn = false;}
        } else {if (occupied) {
            setSelected(true);
            setAttackRow(row);
            setAttackCol(col);
            }
            endPlayerTurn = false;
        }
    }
    const isGameEnd = winnerIndex >= 0;
    if (endPlayerTurn) {
        ctx.endPlayerTurn({newBoard, isGameEnd, winnerIndex});
        setAttackRow(-1)
        setAttackCol(-1)
    }

  };

  return (
    <section className="p-2 shrink-0 grow basis-2/3">
      <table className="m-2 w-[95%] border-collapse table-fixed">
        <tbody>
          {range(9).map(row => (
            <tr style={{transform: `translateX(${row % 2 === 0 ? '0px' : `${100/(2*sizeOfBoard)}%` })`}} key={row}>
              {range(sizeOfBoard).map(col => (
                <td
                  key={col}
                  onClick={() => clickField({ row, col })}
                >
                  <button
                    className={`aspect-square w-full p-[5%] ${row % 2 === 1 && col === sizeOfBoard-1 ? "" : "border-4"}`}
                    style={{backgroundColor: board[row][col] < 0 ? "red" : ((row === attackRow && col === attackCol) ? "green" : "white")}}
                  > {board[row][col] < 0 ? ("") : (board[row][col])}
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
    return "".concat('Kattints egy mezőre, amin van baktérium és hajtsd végre ',
    'a három lehetséges támadás egyikét egy további szabályos kattintással.');
  } else {
    return 'Kattints egy mezőre, amin van baktérium, hogy eltávolíts egy bakériumot onnan.';
  }

};

const rule = <>
  A tábla alsó sorában a kijelölt mezőkön 1-1 baktérium található, a tábla felső sorában
  a kijelölt mezők CÉL mezők. A játékban egy Támadó és Védekező játékos felváltva lép.
  A Védekező játékos minden körében levesz pontosan 1 baktériumot
  bármely általa választott mezőről. Ez a baktérium lekerül a pályáról.
  A Támadó játékos a következő háromféle lépés egyikét választhatja:
    1. Egy mezőn lévő összes baktériummal egyszerre balra vagy jobbra lép egyet.
    2. Egyetlen baktériummal előre ugrik két sornyit.
    3. Kijelöl egy mezőt, ahol végbemegy a sejtosztódás. Ekkor az ezen mezőn lévő összes baktérium
    osztódik: és mindegyikből egy-egy példány balra előre, ill. jobbra előre lép.
  A Támadó akkor nyer, ha legalább egy baktérium bejut valamelyik CÉL mezőbe;
  a Védekező pedig akkor, ha az összes baktérium eltűnt a pályáról.
  Ha egy baktérium a pályán kívülre kerül egy lépéssel, akkor eltávolítottnak minősül.

  Te választhatod meg, hogy Támadó, vagy Védekező játékos szeretnél lenni. Sok sikert! :)

</>;

const Game = strategyGameFactory({
  rule,
  title: 'Baktérimok terjedése',
  firstRoleLabel: 'Támadó leszek',
  secondRoleLabel: 'Védekező leszek',
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
