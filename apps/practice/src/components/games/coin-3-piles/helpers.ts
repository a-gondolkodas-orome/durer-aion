import { cloneDeep, isEqual } from "lodash";
import type { Events } from '../../game-factory';

export type Board = number[]

export const getPlayerStepDescription = ({ ctx: { turnState } }) => {
  if (turnState !== null) {
    return {
      hu: 'Válassz a visszarakási lehetőségek közül.',
      en: 'Choose an option in the place back bar.'
    };
  }
  return {
    hu: 'Kattints egy érmére, hogy elvegyél egyet.',
    en: 'Click a coin to remove it.'
  };
};

export const isWinningState = ({ board }: { board: Board }) => {
  const oddPiles = [0, 1, 2].filter(i => board[i] % 2 === 1);

  return (oddPiles.length === 3 || oddPiles.length === 0);
}

export const moves = {
  removeCoin: (board: Board, { events }: { events: Events }, value) => {
    const nextBoard = cloneDeep(board);
    nextBoard[value - 1] -= 1;
    if (value === 1) {
      events.endTurn();
      if (isEqual(nextBoard, [0, 0, 0])) {
        events.endGame();
      }
    } else {
      events.setTurnState({ removedCoinValue: value });
    }
    return { nextBoard };
  },
  addCoin: (board: Board, { events }: { events: Events }, value) => {
    const nextBoard = cloneDeep(board);
    if (value !== null) {
      nextBoard[value - 1] += 1;
    }
    events.endTurn();
    events.setTurnState(null);
    if (isEqual(nextBoard, [0, 0, 0])) {
      events.endGame();
    }
    return { nextBoard };
  }
}
