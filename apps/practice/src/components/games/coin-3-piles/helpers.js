'use strict';

import { cloneDeep, isEqual } from "lodash";

export const getPlayerStepDescription = ({ ctx: { turnStage } }) => {
  if (turnStage === 'placeBack') {
    return 'Kattints egy érmére a kupac alatt, hogy betegyél egy olyan pénzérmét.';
  }
  return 'Kattints egy érmére, hogy elvegyél egy olyan pénzérmét.';
};

export const isWinningState = ({ board }) => {
  const oddPiles = [0, 1, 2].filter(i => board[i] % 2 === 1);

  return (oddPiles.length === 3 || oddPiles.length === 0);
}

export const moves = {
  removeCoin: (board, { events }, value) => {
    const nextBoard = cloneDeep(board);
    nextBoard[value - 1] -= 1;
    if (value === 1) {
      events.endTurn();
      if (isEqual(nextBoard, [0, 0, 0])) {
        events.endGame();
      }
    } else {
      events.setTurnStage('placeBack');
    }
    return { nextBoard };
  },
  undoRemoveCoin: (board, { events }, value) => {
    const nextBoard = cloneDeep(board);
    nextBoard[value - 1] += 1;
    events.setTurnStage(null);
    return { nextBoard };
  },
  addCoin: (board, { events }, value) => {
    const nextBoard = cloneDeep(board);
    if (value !== null) {
      nextBoard[value - 1] += 1;
    }
    events.endTurn();
    events.setTurnStage(null);
    if (isEqual(nextBoard, [0, 0, 0])) {
      events.endGame();
    }
    return { nextBoard };
  }
}
