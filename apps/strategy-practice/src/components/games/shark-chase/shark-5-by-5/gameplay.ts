import { makeGameplay, type Board } from '../gameplay';

// The shark wins by surviving to the end of day 15.
export const MAX_TURN = 15;

export const startBoard: Board = {
  submarines: [
    [0, 0, 0, 1, 1],
    [0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ].flat(),
  shark: 20,
  turn: 1,
  sharkMovesInTurn: 0
};

export const { isGameEnd, getWinnerIndex, moves } = makeGameplay(MAX_TURN);

export type Moves = typeof moves;
