"use strict";

import { cloneDeep, sample, minBy, shuffle, groupBy, filter, sum } from "lodash";
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
  let defenseRow, defenseCol;

  const bacteriaCoords = getBacteriaCoords(board.bacteria);
  const dangerousBacteria = bacteriaCoords.filter(
    ([row, col]) => isDangerous(board, { row, col })
  );
  const bacteriaByPath = groupBy(
    bacteriaCoords,
    ([row, col]) => {
      const { dist, dir } = distanceFromDangerousAttackZone(board, { row, col });
      return `${dir}:${dist}`
    }
  );
  const pathsWithMultipleBacteria = filter(bacteriaByPath, p =>
    sum(p.map(([row, col]) => board.bacteria[row][col])) > 1
  );
  if (pathsWithMultipleBacteria.length >= 1) {
    [defenseRow, defenseCol] = sample(sample(pathsWithMultipleBacteria));
  } else if (dangerousBacteria.length >= 1) {
    [defenseRow, defenseCol] = sample(dangerousBacteria);
  } else {
    [defenseRow, defenseCol] = minBy(
      shuffle(bacteriaCoords),
      ([row, col]) => distanceFromDangerousAttackZone(board, { row, col }).dist
    );
  }

  newBoard.bacteria[defenseRow][defenseCol] -= 1;
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
      ([row, col]) => distanceFromDangerousAttackZone(board, { row, col }).dist
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
    } else if (attackRow === (goalRowIdx - 2) && (attackCol === 0 || attackCol === lastCol(bacteria, attackRow))) {
      attackChoice = "jump";
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
      if (bacteria[row][col] > 0) bacteriaCoords.push([row, col]);
    }
  }
  return bacteriaCoords;
};
