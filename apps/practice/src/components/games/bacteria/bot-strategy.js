"use strict";

import {
  sample,
  minBy,
  shuffle,
  groupBy,
  filter,
  sum
} from "lodash";
import {
  lastCol,
  isDangerous,
  distanceFromDangerousAttackZone,
  isOddEdge
} from "./helpers";

/* Currently only implemented for the case of adjacent goal fields */
export const aiBotStrategy = ({ board, ctx, moves }) => {
  if (ctx.chosenRoleIndex === 0) {
    const { defenseRow, defenseCol } = aiDefense(board);
    moves.defend(board, { row: defenseRow, col: defenseCol });
  } else {
    const { attackChoice, attackRow, attackCol } = aiAttack(board);
    switch(attackChoice) {
      case 'shiftRight': moves.shiftRight(board, { row: attackRow, col: attackCol });
      case 'shiftLeft': moves.shiftLeft(board, { row: attackRow, col: attackCol });
      case 'jump': moves.jump(board, { row: attackRow, col: attackCol });
      case 'spread': moves.spread(board, { row: attackRow, col: attackCol });
    }
  }
};

export const aiDefense = (board) => {
  let defenseRow, defenseCol;

  const bacteriaCoords = getBacteriaCoords(board.bacteria);
  const dangerousBacteria = bacteriaCoords.filter(
    ([row, col]) => isDangerous(board, { row, col })
  );
  const bacteriaByPath = groupBy(
    bacteriaCoords.filter(([row, col]) => !isDangerous(board, { row, col })),
    ([row, col]) => {
      const { dist, dir } = distanceFromDangerousAttackZone(board, { row, col });
      return `${dir}:${dist}`
    }
  );
  const pathsWithMultipleBacteria = filter(bacteriaByPath, p => {
    const adjustedBacteriaCount = p.map(([row, col]) => {
      if (board.bacteria[row][col] > 1 && isOddEdge(board.bacteria, { row, col })) {
        return board.bacteria[row][col] - 1;
      }
      return board.bacteria[row][col];
    });
    return sum(adjustedBacteriaCount) > 1;
  });
  if (pathsWithMultipleBacteria.length >= 1) {
    [defenseRow, defenseCol] = sample(sample(pathsWithMultipleBacteria));
  } else if (dangerousBacteria.length >= 1) {
    [defenseRow, defenseCol] = minBy(
      shuffle(dangerousBacteria),
      ([row]) => -row
    );
  } else {
    [defenseRow, defenseCol] = minBy(
      shuffle(bacteriaCoords),
      ([row, col]) => distanceFromDangerousAttackZone(board, { row, col }).dist
    );
  }

  return { defenseRow, defenseCol };
};

export const aiAttack = (board) => {
  const { bacteria, goals } = board;

  const goalRowIdx = bacteria.length - 1;
  const bacteriaCoords = getBacteriaCoords(bacteria);
  const dangerousBacteria = bacteriaCoords.filter(
    ([row, col]) => isDangerous(board, { row, col })
  );
  let attackRow, attackCol;
  let attackChoice;

  if (dangerousBacteria.length >= 1) {
    [attackRow, attackCol] = minBy(
      shuffle(dangerousBacteria),
      ([row]) => -row
    );
    if (attackRow === goalRowIdx) {
      attackChoice = (attackCol === goals[0] - 1) ? "shiftRight" : "shiftLeft";
    } else if (attackRow === (goalRowIdx - 2) && (attackCol === 0 || attackCol === lastCol(bacteria, attackRow))) {
      attackChoice = "jump";
    } else {
      attackChoice = "spread";
    }
  } else {
    // Currently AI is moderately dangerous: not random but not as dangerous as possible either
    const coordsWithMultiples = bacteriaCoords.filter(([row, col]) => {
      if (board.bacteria[row][col] <= 1) return false;
      if (isOddEdge(board.bacteria, { row, col })) return false;
      return true;
    });
    if (coordsWithMultiples.length >= 1) {
      [attackRow, attackCol] = sample(coordsWithMultiples);
    } else {
      [attackRow, attackCol] = minBy(
        shuffle(bacteriaCoords),
        ([row, col]) => distanceFromDangerousAttackZone(board, { row, col }).dist
      );
    }
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
  }

  return { attackChoice, attackRow, attackCol };
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
