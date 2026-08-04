import { random } from "lodash";
import { neighbours, POLICE } from "./helpers";
import type { Board, moves } from "./policeman-thief-ab";
import type { BotMove, BotStrategy } from "../../../strategy-game-factory";

type MoveName = keyof typeof moves
type Bot = BotStrategy<Board, MoveName>

export const smartBotStrategy: Bot = ({ board, ctx }) =>
  ctx.chosenRoleIndex === POLICE ? thiefMove(board) : policemenMoves(board);

// Both policemen step in the same turn, planned together from the position they
// start in, so the turn is named as a whole.
const policemenMoves = (board: Board): BotMove<MoveName>[] => {
  //policeman0 Step
  let index0 = board.policemen[0];
  // where it would catch the thief outright, which overrides any later choice
  let catchIndex0: number | null = null;
  for (let i = 0; i < 3; i++) {
    if (neighbours[board.policemen[0]][i] === board.thief) {
      index0 = neighbours[board.policemen[0]][i];
      catchIndex0 = index0;
    } else {
      for (let j = 0; j < 3; j++) {
        if (neighbours[neighbours[board.policemen[0]][i]][j] === board.thief) {
          index0 = neighbours[board.policemen[0]][i];
        }
      }
    }
  }
  if (index0 === board.policemen[0]) {
    index0 = neighbours[board.policemen[0]][random(0, 2)];
  }

  //policeman1 Step
  let index1 = board.policemen[1];
  let catchIndex1: number | null = null;
  for (let i = 0; i < 3; i++) {
    if (
      neighbours[board.policemen[1]][i] === board.thief &&
      index0 !== neighbours[board.policemen[1]][i]
    ) {
      index1 = neighbours[board.policemen[1]][i];
      catchIndex1 = index1;
    } else {
      for (let j = 0; j < 3; j++) {
        if (
          neighbours[neighbours[board.policemen[1]][i]][j] === board.thief &&
          index0 !== neighbours[board.policemen[1]][i]
        ) {
          index1 = neighbours[board.policemen[1]][i];
        }
      }
    }
  }
  if (index1 === board.policemen[1]) {
    while (index1 === index0 || index1 === board.policemen[1]) {
      index1 = neighbours[board.policemen[1]][random(0, 2)];
    }
  }

  return [
    { move: 'moveFirstPoliceman', args: [catchIndex0 ?? index0] },
    { move: 'moveSecondPoliceman', args: [catchIndex1 ?? index1] }
  ];
};

const thiefMove = (board: Board): BotMove<MoveName> => {
  let index = board.thief;
  for (let i = 0; i < 3; i++) {
    if (
      neighbours[board.thief][i] !== board.policemen[0] &&
      neighbours[board.thief][i] !== board.policemen[1]
    ) {
      for (let j = 0; j < 3; j++) {
        const fieldToCheck = neighbours[neighbours[board.thief][i]][j];
        if (fieldToCheck !== board.policemen[0] && fieldToCheck !== board.policemen[1]) {
          index = neighbours[board.thief][i];
        }
      }
    }
  }
  if (index === board.thief) {
    index = neighbours[board.thief][random(0, 2)];
  }
  return { move: 'moveThief', args: [index] };
};
