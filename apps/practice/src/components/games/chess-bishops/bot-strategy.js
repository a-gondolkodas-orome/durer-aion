'use strict';

import { sample, cloneDeep, random, shuffle } from 'lodash';
import { markForbiddenFields, getAllowedMoves, boardIndices, BISHOP } from './helpers';

const HORIZONTAL = "h";
const VERTICAL = "v";
let axis = null;

export const aiBotStrategy = ({ board, moves }) => {
  const aiMove = getOptimalAiMove(board);
  moves.placeBishop(board, aiMove);
};

export const getOptimalAiMove = (board) => {
  const allowedHMirrorMoves = boardIndices.filter(
    ({ row, col }) => board[row][col] === null && board[row][7 - col] === BISHOP
  );
  const allowedVMirrorMoves = boardIndices.filter(
    ({ row, col }) => board[row][col] === null && board[7 - row][col] === BISHOP
  );

  const bishopCount = boardIndices.filter(({ row, col }) => board[row][col] === BISHOP).length;
  // we are playing according to optimal winning strategy
  // as a first step, choose a mirror axis randomly
  if (bishopCount === 1) {
    axis = random(0, 1) ? HORIZONTAL : VERTICAL;
  }
  if (bishopCount < 4) {
    if (axis === HORIZONTAL && allowedHMirrorMoves.length === 1) {
      return allowedHMirrorMoves[0];
    }
    if (axis === VERTICAL && allowedVMirrorMoves.length === 1) {
      return allowedVMirrorMoves[0];
    }
  }

  const allowedMoves = getAllowedMoves(board);

  // use pre-calculated optimal 3rd moves as live calculation would be too slow
  if (bishopCount == 2) {
    const optimalPlace = getOptimalThirdStep(board);
    if (optimalPlace !== undefined) {
      return optimalPlace;
    }
  }
  // try to win from bad position if player does not play optimally
  if (bishopCount >= 4) {
    // sample + find has the same effect as filter + sample: find a random
    // from the optimal moves
    const optimalPlace = shuffle(allowedMoves).find(({ row, col }) => {
      const boardCopy = cloneDeep(board);
      markForbiddenFields(boardCopy, { row, col });
      boardCopy[row][col] = BISHOP;
      return isWinningState(boardCopy, false);
    });


    if (optimalPlace !== undefined) {
      return optimalPlace;
    }
  }
  return sample(allowedMoves);
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIPlayer) => {
  if (getAllowedMoves(board).length === 0) {
    return true;
  }

  const allowedPlacesForOther = getAllowedMoves(board);

  const optimalPlaceForOther = allowedPlacesForOther.find(({ row, col }) => {
    const boardCopy = cloneDeep(board);
    markForbiddenFields(boardCopy, { row, col });
    boardCopy[row][col] = BISHOP;
    return isWinningState(boardCopy, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};

const rotate90 = ([r, c]) => [c, 8 - 1 - r];
const flip = ([r, c]) => [8 - 1 - r, c];

const getOptimalThirdStep = (board) => {
  const bishops = boardIndices.filter(({ row, col }) => board[row][col] === BISHOP);
  const [r1, c1, r2, c2] = [bishops[0]['row'], bishops[0]['col'], bishops[1]['row'], bishops[1]['col']];

  const equivalentPositions = [
    { 'bishops': [[r1, c1], [r2, c2]], type: 'original' }
  ];

  // rotate 90
  let mb1 = rotate90([r1, c1]);
  let mb2 = rotate90([r2, c2]);
  equivalentPositions.push({ 'bishops': [mb1, mb2], type: 'rotate90' });
  equivalentPositions.push({ 'bishops': [mb2, mb1], type: 'rotate90' });

  // rotate 180
  mb1 = rotate90(mb1);
  mb2 = rotate90(mb2);
  equivalentPositions.push({ bishops: [mb1, mb2], type: 'rotate180' });
  equivalentPositions.push({ bishops: [mb2, mb1], type: 'rotate180' });

  // rotate 270
  mb1 = rotate90(mb1);
  mb2 = rotate90(mb2);
  equivalentPositions.push({ bishops: [mb1, mb2], type: 'rotate270' });
  equivalentPositions.push({ bishops: [mb2, mb1], type: 'rotate270' });

  // horizontal flip
  mb1 = flip(mb1);
  mb2 = flip(mb2);
  equivalentPositions.push({ bishops: [mb1, mb2], type: 'rotate270-hflip' });
  equivalentPositions.push({ bishops: [mb2, mb1], type: 'rotate270-hflip' });

  // horizontal flip + rotate 90
  mb1 = rotate90(mb1);
  mb2 = rotate90(mb2);
  equivalentPositions.push({ bishops: [mb1, mb2], type: 'rotate270-hflip-rotate90' });
  equivalentPositions.push({ bishops: [mb2, mb1], type: 'rotate270-hflip-rotate90' });

  // horizontal flip + rotate 180
  mb1 = rotate90(mb1);
  mb2 = rotate90(mb2);
  equivalentPositions.push({ bishops: [mb1, mb2], type: 'rotate270-hflip-rotate180' });
  equivalentPositions.push({ bishops: [mb2, mb1], type: 'rotate270-hflip-rotate180' });

  // horizontal flip + rotate 270
  mb1 = rotate90(mb1);
  mb2 = rotate90(mb2);
  equivalentPositions.push({ bishops: [mb1, mb2], type: 'rotate270-hflip-rotate270' });
  equivalentPositions.push({ bishops: [mb2, mb1], type: 'rotate270-hflip-rotate270' });

  const pos = equivalentPositions.find(({ bishops: [[r1, c1], [r2, c2]] }) =>
    aiOptimalThirdSteps[`${r1};${c1} - ${r2};${c2}`] !== undefined
  )

  if (pos !== undefined) {
    const bishops = pos['bishops'];
    const optimalStep =  aiOptimalThirdSteps[`${bishops[0][0]};${bishops[0][1]} - ${bishops[1][0]};${bishops[1][1]}`]
    const transformedStep = invertTransformation(
      [optimalStep['row'], optimalStep['col']],
      pos['type']
    );
    return { row: transformedStep[0], col: transformedStep[1] };
  } {
    return undefined;
  }
};

const invertTransformation = (stepCoords, type) => {
  switch (type) {
    case 'original': return stepCoords;
    case 'rotate90': return rotate90(rotate90(rotate90(stepCoords)));
    case 'rotate180': return rotate90(rotate90(stepCoords));
    case 'rotate270': return rotate90(stepCoords);
    case 'rotate270-hflip': return rotate90(flip(stepCoords));
    case 'rotate270-hflip-rotate90': return rotate90(flip(rotate90(rotate90(rotate90(stepCoords)))));
    case 'rotate270-hflip-rotate180': return rotate90(flip(rotate90(rotate90(stepCoords))));
    case 'rotate270-hflip-rotate270': return rotate90(flip(rotate90(stepCoords)));
  }
};

const aiOptimalThirdSteps = {
  "0;0 - 0;1": {"row":3,"col":6},
  "0;0 - 0;2": {"row":3,"col":2},
  "0;0 - 0;3": {"row":4,"col":1},
  "0;0 - 0;4": {"row":3,"col":2},
  "0;0 - 0;5": {"row":7,"col":6},
  "0;0 - 0;6": {"row":4,"col":3},
  "0;0 - 1;2": {"row":1,"col":0},
  "0;0 - 1;3": {"row":5,"col":4},
  "0;0 - 1;4": {"row":6,"col":7},
  "0;0 - 1;5": {"row":4,"col":3},
  "0;0 - 1;6": {"row":7,"col":2},
  "0;0 - 1;7": {"row":4,"col":5},
  "0;0 - 2;3": {"row":1,"col":0},
  "0;0 - 2;4": {"row":1,"col":0},
  "0;0 - 2;5": {"row":7,"col":6},
  "0;0 - 2;6": {"row":4,"col":3},
  "0;0 - 2;7": {"row":0,"col":1},
  "0;0 - 3;4": {"row":1,"col":0},
  "0;0 - 3;5": {"row":0,"col":1},
  "0;0 - 3;6": {"row":6,"col":7},
  "0;0 - 3;7": {"row":3,"col":4},
  "0;0 - 4;5": {"row":1,"col":0},
  "0;0 - 4;6": {"row":4,"col":5},
  "0;0 - 4;7": {"row":1,"col":0},
  "0;0 - 5;6": {"row":1,"col":0},
  "0;0 - 5;7": {"row":3,"col":2},
  "0;0 - 6;7": {"row":3,"col":2},
  "0;1 - 0;2": {"row":4,"col":4},
  "0;1 - 0;3": {"row":0,"col":0},
  "0;1 - 0;4": {"row":2,"col":4},
  "0;1 - 0;5": {"row":7,"col":7},
  "0;1 - 1;1": {"row":4,"col":2},
  "0;1 - 1;3": {"row":1,"col":5},
  "0;1 - 1;4": {"row":7,"col":7},
  "0;1 - 1;5": {"row":5,"col":5},
  "0;1 - 1;6": {"row":7,"col":7},
  "0;1 - 2;0": {"row":4,"col":4},
  "0;1 - 2;1": {"row":0,"col":0},
  "0;1 - 2;2": {"row":6,"col":2},
  "0;1 - 2;4": {"row":7,"col":3},
  "0;1 - 2;5": {"row":0,"col":0},
  "0;1 - 2;6": {"row":6,"col":4},
  "0;1 - 2;7": {"row":0,"col":0},
  "0;1 - 3;0": {"row":7,"col":7},
  "0;1 - 3;1": {"row":5,"col":1},
  "0;1 - 3;2": {"row":7,"col":7},
  "0;1 - 3;3": {"row":2,"col":6},
  "0;1 - 3;5": {"row":1,"col":5},
  "0;1 - 3;6": {"row":0,"col":0},
  "0;1 - 3;7": {"row":5,"col":3},
  "0;1 - 4;0": {"row":2,"col":4},
  "0;1 - 4;1": {"row":0,"col":0},
  "0;1 - 4;2": {"row":4,"col":0},
  "0;1 - 4;3": {"row":0,"col":0},
  "0;1 - 4;4": {"row":4,"col":0},
  "0;1 - 4;6": {"row":2,"col":6},
  "0;1 - 4;7": {"row":0,"col":0},
  "0;1 - 5;0": {"row":0,"col":0},
  "0;1 - 5;1": {"row":5,"col":5},
  "0;1 - 5;2": {"row":7,"col":7},
  "0;1 - 5;3": {"row":6,"col":6},
  "0;1 - 5;4": {"row":0,"col":0},
  "0;1 - 5;5": {"row":6,"col":2},
  "0;1 - 5;7": {"row":4,"col":2},
  "0;1 - 6;1": {"row":0,"col":0},
  "0;1 - 6;2": {"row":2,"col":4},
  "0;1 - 6;3": {"row":0,"col":0},
  "0;1 - 6;4": {"row":6,"col":2},
  "0;1 - 6;5": {"row":0,"col":0},
  "0;1 - 6;6": {"row":3,"col":5},
  "0;1 - 7;2": {"row":7,"col":7},
  "0;1 - 7;3": {"row":3,"col":5},
  "0;1 - 7;4": {"row":7,"col":7},
  "0;1 - 7;5": {"row":2,"col":4},
  "0;1 - 7;6": {"row":4,"col":4},
  "0;2 - 0;4": {"row":5,"col":4},
  "0;2 - 1;4": {"row":4,"col":3},
  "0;2 - 1;5": {"row":3,"col":4},
  "0;2 - 2;2": {"row":3,"col":2},
  "0;2 - 2;3": {"row":3,"col":6},
  "0;2 - 2;5": {"row":4,"col":5},
  "0;2 - 2;6": {"row":3,"col":4},
  "0;2 - 3;1": {"row":3,"col":4},
  "0;2 - 3;2": {"row":0,"col":0},
  "0;2 - 3;3": {"row":7,"col":6},
  "0;2 - 3;4": {"row":7,"col":5},
  "0;2 - 3;6": {"row":4,"col":3},
  "0;2 - 3;7": {"row":4,"col":3},
  "0;2 - 4;0": {"row":3,"col":2},
  "0;2 - 4;1": {"row":3,"col":4},
  "0;2 - 4;2": {"row":7,"col":6},
  "0;2 - 4;3": {"row":6,"col":4},
  "0;2 - 4;4": {"row":6,"col":7},
  "0;2 - 4;5": {"row":6,"col":4},
  "0;2 - 5;1": {"row":4,"col":3},
  "0;2 - 5;2": {"row":3,"col":2},
  "0;2 - 5;3": {"row":1,"col":0},
  "0;2 - 5;4": {"row":6,"col":4},
  "0;2 - 5;5": {"row":3,"col":2},
  "0;2 - 6;2": {"row":5,"col":4},
  "0;2 - 6;3": {"row":4,"col":3},
  "0;2 - 6;4": {"row":3,"col":4},
  "0;2 - 6;6": {"row":0,"col":7},
  "0;2 - 7;3": {"row":4,"col":3},
  "0;2 - 7;5": {"row":5,"col":4},
  "0;3 - 1;3": {"row":5,"col":5},
  "0;3 - 1;6": {"row":4,"col":2},
  "0;3 - 2;2": {"row":4,"col":6},
  "0;3 - 2;3": {"row":1,"col":7},
  "0;3 - 2;4": {"row":6,"col":1},
  "0;3 - 3;1": {"row":2,"col":4},
  "0;3 - 3;2": {"row":6,"col":0},
  "0;3 - 3;3": {"row":1,"col":6},
  "0;3 - 3;4": {"row":1,"col":7},
  "0;3 - 3;5": {"row":5,"col":0},
  "0;3 - 4;1": {"row":0,"col":0},
  "0;3 - 4;2": {"row":0,"col":7},
  "0;3 - 4;3": {"row":1,"col":7},
  "0;3 - 4;4": {"row":4,"col":2},
  "0;3 - 4;5": {"row":1,"col":7},
  "0;3 - 4;6": {"row":4,"col":2},
  "0;3 - 5;2": {"row":7,"col":7},
  "0;3 - 5;3": {"row":0,"col":5},
  "0;3 - 5;4": {"row":0,"col":6},
  "0;3 - 5;5": {"row":2,"col":4},
  "0;3 - 5;6": {"row":5,"col":3},
  "0;3 - 6;1": {"row":2,"col":4},
  "0;3 - 6;3": {"row":7,"col":7},
  "0;3 - 6;4": {"row":4,"col":4},
  "0;3 - 6;5": {"row":3,"col":5},
  "0;3 - 7;4": {"row":4,"col":4},
  "1;1 - 1;3": {"row":4,"col":5},
  "1;1 - 1;4": {"row":4,"col":5},
  "1;1 - 1;5": {"row":3,"col":4},
  "1;1 - 2;3": {"row":2,"col":6},
  "1;1 - 2;4": {"row":1,"col":0},
  "1;1 - 2;5": {"row":4,"col":1},
  "1;1 - 2;6": {"row":3,"col":2},
  "1;1 - 3;4": {"row":3,"col":7},
  "1;1 - 3;5": {"row":0,"col":1},
  "1;1 - 3;6": {"row":3,"col":4},
  "1;1 - 4;5": {"row":4,"col":1},
  "1;1 - 4;6": {"row":4,"col":3},
  "1;2 - 1;3": {"row":5,"col":3},
  "1;2 - 1;4": {"row":1,"col":7},
  "1;2 - 2;2": {"row":6,"col":4},
  "1;2 - 2;4": {"row":6,"col":4},
  "1;2 - 2;5": {"row":7,"col":1},
  "1;2 - 3;1": {"row":3,"col":3},
  "1;2 - 3;2": {"row":6,"col":0},
  "1;2 - 3;3": {"row":7,"col":0},
  "1;2 - 3;5": {"row":7,"col":2},
  "1;2 - 3;6": {"row":1,"col":7},
  "1;2 - 4;1": {"row":6,"col":0},
  "1;2 - 4;2": {"row":0,"col":5},
  "1;2 - 4;3": {"row":6,"col":0},
  "1;2 - 4;4": {"row":4,"col":2},
  "1;2 - 4;6": {"row":3,"col":1},
  "1;2 - 5;2": {"row":6,"col":0},
  "1;2 - 5;3": {"row":0,"col":7},
  "1;2 - 5;4": {"row":0,"col":6},
  "1;2 - 5;5": {"row":4,"col":2},
  "1;2 - 6;3": {"row":1,"col":7},
  "1;2 - 6;4": {"row":2,"col":4},
  "1;2 - 6;5": {"row":1,"col":7},
  "1;3 - 2;3": {"row":0,"col":0},
  "1;3 - 3;2": {"row":2,"col":0},
  "1;3 - 3;3": {"row":6,"col":1},
  "1;3 - 3;4": {"row":7,"col":7},
  "1;3 - 4;2": {"row":3,"col":0},
  "1;3 - 4;3": {"row":1,"col":1},
  "1;3 - 4;4": {"row":0,"col":3},
  "1;3 - 4;5": {"row":7,"col":5},
  "1;3 - 5;3": {"row":2,"col":7},
  "1;3 - 5;4": {"row":2,"col":0},
  "1;3 - 5;5": {"row":4,"col":7},
  "1;3 - 6;4": {"row":2,"col":1},
  "2;2 - 2;3": {"row":5,"col":7},
  "2;2 - 2;4": {"row":0,"col":3},
  "2;2 - 3;4": {"row":2,"col":0},
  "2;2 - 3;5": {"row":1,"col":6},
  "2;2 - 4;5": {"row":2,"col":0},
  "2;3 - 4;3": {"row":6,"col":2},
  "2;3 - 5;4": {"row":3,"col":7}
};
