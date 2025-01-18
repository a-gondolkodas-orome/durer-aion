'use strict';

import { random, flatten, cloneDeep, sum, _, remove, tail } from 'lodash';

export const generateStartBoard = () => {
  // this code is not 50% Hunyadi - 50% Szultan winnin position generator,
  // but relatively balanced and biased toward situations with more soldiers
  // and not single-step game
  const rowCount = 5;
  let board = [];
  // for debugging purposes
  let totalScore = 0;
  for (let i = 0; i < (rowCount - 1); i++) {
    const row = [];
    if (i === 0) {
      row.push('blue');
      totalScore += 1;
    }
    if (random(0, 6) >= 3) {
      row.push('blue');
      totalScore += (1/2)**i;
    }
    board.push(row);
  }
  board.push([]);

  for (let i = 0; i < (rowCount - 1); i++) {
    for (let j of board[i]) {
      if (random(0, 4) >= 2) {
        board[i].splice(j, 1);
        board[i + 1].push('blue', 'blue');
      }
    }
  }

  const soldierCount = sum(board.map(row => row.length));
  if (totalScore <= 1.25 || soldierCount <= 2) {
    // generate a more complex situation
    return generateStartBoard();
  }

  // first pile: for soldiers who reached the castle
  return [[], ...board];
};

export const moves = {
  killGroup: (board, { events }, group) => {
    const nextBoard = board.map(row => remove(row, soldier => soldier !== group))

    const isGameEnd = flatten(nextBoard).length === 0;
    if (isGameEnd) {
      events.endTurn();
      events.endGame({ winnerIndex: 1 });
    }
    return { nextBoard, isGameEnd };
  },
  finalizeSeparation: (board, { events }) => {
    events.endTurn();
    return { nextBoard: board };
  },
  setGroupOfSoldiers: (board, _, soldiers) => {
    const nextBoard = cloneDeep(board);
    for (const soldier of soldiers) {
      nextBoard[soldier.rowIndex][soldier.pieceIndex] = soldier.group;
    }
    return { nextBoard };
  },
  stepUp: (board, { events }) => {
    const nextBoard = [...tail(board), []];
    events.endTurn();
    if (nextBoard[0].length > 0) {
      events.endGame({ winnerIndex: 0 });
    }
    return { nextBoard };
  }
}
