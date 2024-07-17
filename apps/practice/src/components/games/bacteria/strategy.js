"use strict";

import { cloneDeep, sample, minBy, shuffle } from "lodash";
import {
  areAllBacteriaRemoved,
  isGoal,
  lastCol,
  makeJump,
  makeShiftOrSpread,
  reachedFieldsWithAttack,
  isDangerous,
  distanceFromDangerousAttackZone
} from "./helpers";

/* Currently only implemented for the case of adjacent goal fields */
export const getGameStateAfterAiTurn = ({ board, playerIndex }) => {
  if (playerIndex === 0) {
    return aiDefense(board);
  } else {
    return aiAttack(board);
  }
};

const aiDefense = (board) => {
  const newBoard = cloneDeep(board);

  const bacteriaCoords = getBacteriaCoords(board.bacteria);
  const dangerousBacteria = bacteriaCoords.filter(
    ([row, col]) => isDangerous(board, { row, col })
  );
  if (dangerousBacteria.length >= 1) {
    const [defenseRow, defenseCol] = sample(dangerousBacteria);
    newBoard.bacteria[defenseRow][defenseCol] -= 1;
  } else {
    const [defenseRow, defenseCol] = minBy(
      shuffle(bacteriaCoords),
      ([row, col]) => -100 * board.bacteria[row][col] + distanceFromDangerousAttackZone(board, { row, col })
    );
    newBoard.bacteria[defenseRow][defenseCol] -= 1;
  }

  const isGameEnd = areAllBacteriaRemoved(newBoard.bacteria);
  return { newBoard, isGameEnd };
};

const aiAttack = (board) => {
  const newBoard = cloneDeep(board);
  const { bacteria, goals } = board;

  const goalRowIdx = bacteria.length - 1;
  const bacteriaCoords = getBacteriaCoords(bacteria);
  const dangerousBacteria = bacteriaCoords.filter(
    ([row, col]) => isDangerous(board, { row, col })
  );
  let attackRow, attackCol;
  let attackChoice;

  if (dangerousBacteria.length === 0) {
    // Currently AI is moderately dangerous: not random but not as dangerous as possible either
    [attackRow, attackCol] = minBy(
      shuffle(bacteriaCoords),
      ([row, col]) => distanceFromDangerousAttackZone(board, { row, col })
    );
    let attackOptions = ["shiftRight", "shiftLeft", "jump", "spread", "spread", "spread", "spread"];
    if (attackRow === goalRowIdx - 1) {
      attackOptions = ["spread"];
    }
    if (attackRow === goalRowIdx) {
      if (attackCol <= goals[0]) attackOptions = ["shiftRight"]
      else attackOptions = ["shiftLeft"]
    }
    attackChoice = sample(attackOptions);
    if (attackChoice === "shiftRight" && attackCol === lastCol(bacteria, attackRow)) {
      attackChoice = "shiftLeft";
    } else if (attackChoice === "shiftLeft" && attackCol === 0) {
      attackChoice = "shiftRight";
    }
  } else {
    [attackRow, attackCol] = sample(dangerousBacteria);
    if (attackRow === goalRowIdx) {
      attackChoice = (attackCol === goals[0] - 1) ? "shiftRight" : "shiftLeft";
    } else {
      attackChoice = "spread";
    }
  }


  const reachedFields = reachedFieldsWithAttack(attackChoice, { bacteria, attackRow, attackCol });
  const goalsReached = reachedFields.filter(([row, col]) => isGoal(board, row, col));
  const isGameEnd = goalsReached.length >= 1;

  if (attackChoice === "jump") {
    newBoard.bacteria = makeJump(bacteria, attackRow, attackCol);
  } else {
    newBoard.bacteria = makeShiftOrSpread(bacteria, attackRow, attackCol, reachedFields);
  }

  return { newBoard, isGameEnd };
};

const getBacteriaCoords = (bacteria) => {
  let bacteriaCoords = [];
  for (let row = 0; row < bacteria.length; row++) {
    for (let col = 0; col < bacteria[row].length; col++) {
      for (let i = 0; i < bacteria[row][col]; i++) {
        bacteriaCoords.push([row, col]);
      }
    }
  }
  return bacteriaCoords;
};
