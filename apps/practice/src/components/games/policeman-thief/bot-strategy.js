"use strict";

import { random } from "lodash";
import { neighbours } from "./helpers";

export const aiBotStrategy = ({ board, ctx, moves }) => {
  if (ctx.chosenRoleIndex === 0) {
    moveThiefOptimally({ board, moves });
  } else {
    movePolicemenOptimally({ board, moves });
  }
};

const movePolicemenOptimally = ({ board, moves }) => {
  //policeman0 Step
  let index0 = board.policemen[0];
  let canWeCatch0 = false;
  let nextBoard;
  for (let i = 0; i < 3; i++) {
    if (neighbours[board.policemen[0]][i] === board.thief) {
      index0 = neighbours[board.policemen[0]][i];

      nextBoard = moves.moveFirstPoliceman(board, index0).nextBoard;
      canWeCatch0 = true;
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
  if (!canWeCatch0) {
    nextBoard = moves.moveFirstPoliceman(board, index0).nextBoard;
  }

  // timeout so that AI bot seems to be thinking between moves as well
  setTimeout(() => {
    //policeman1 Step
    let index1 = board.policemen[1];
    let canWeCatch1 = false;
    for (let i = 0; i < 3; i++) {
      if (
        neighbours[board.policemen[1]][i] === board.thief &&
        index0 !== neighbours[board.policemen[1]][i]
      ) {
        index1 = neighbours[board.policemen[1]][i];
        moves.moveSecondPoliceman(nextBoard, index1);
        canWeCatch1 = true;
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
    if (!canWeCatch1) {
      moves.moveSecondPoliceman(nextBoard, index1);
    }
  }, 750);

};

const moveThiefOptimally = ({ board, moves }) => {
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
  moves.moveThief(board, index);
};
