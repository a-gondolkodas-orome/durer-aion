import { getBoardIndices, moves, getAllowedMoves, type Board, type Field } from "./helpers";
import { dummyEvents, type StrategyArgs } from "../../game-factory";
import { shuffle, sample } from "lodash";

/* This strategy file is relevant for the 4x7 case */
const [ROWS, COLS] = [4, 7];
const [DUCK] = [1];

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.placeDuck(board, sample(getAllowedMoves(board)));
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const botMove = getOptimalSmartBotMove(board);
  moves.placeDuck(board, botMove);
};

const getOptimalSmartBotMove = (board: Board): Field => {
  const allowedMoves = getAllowedMoves(board);
  const boardIndices = getBoardIndices(board.length, board[0].length);

  const colCount = board[0].length;

  const ducks = boardIndices.filter(({ row, col }) => board[row][col] === DUCK);
  const duckCount = ducks.length;

  // live search is too slow and there is no optimal first step anyways
  if (duckCount === 0) {
    return sample(allowedMoves)!;
  }

  // live search is too slow
  if (duckCount === 1 && colCount === 7) {
    return smartBotOptimalSecondSteps[`${ducks[0].row};${ducks[0].col}`];
  }

  // use pre-calculated optimal 3rd moves as live calculation would be too slow
  if (duckCount == 2 && colCount === 7) {
    const optimalPlace = getOptimalThirdStep(board);
    if (optimalPlace !== undefined) {
      return optimalPlace;
    }
  }

  if (duckCount >= 3 || colCount === 6) {
    // sample + find has the same effect as filter + sample: find a random
    // from the optimal moves
    const optimalPlace = shuffle(allowedMoves).find(({ row, col }) => {
      const { nextBoard } = moves.placeDuck(board, { events: dummyEvents }, { row, col });
      return isWinningState(nextBoard, false);
    });

    if (optimalPlace !== undefined) {
      return optimalPlace;
    }
  }

  return sample(allowedMoves)!;
};

type Coords = [number, number];

const flipH = ([r, c]: Coords): Coords => [ROWS - 1 - r, c];
const flipV = ([r, c]: Coords): Coords => [r, COLS - 1 - c];

type TransformationType = 'original' | 'flipV' | 'rotate180' | 'flipH';

const getOptimalThirdStep = (board: Board): Field | undefined => {
  const boardIndices = getBoardIndices(board.length, board[0].length);
  const ducks = boardIndices.filter(({ row, col }) => board[row][col] === DUCK);
  const [r1, c1, r2, c2] = [ducks[0]['row'], ducks[0]['col'], ducks[1]['row'], ducks[1]['col']];

  const equivalentPositions: { ducks: [Coords, Coords]; type: TransformationType }[] = [
    { 'ducks': [[r1, c1], [r2, c2]], type: 'original' }
  ];

  // vertical flip
  let mb1 = flipV([r1, c1]);
  let mb2 = flipV([r2, c2]);
  equivalentPositions.push({ 'ducks': [mb1, mb2], type: 'flipV' });
  equivalentPositions.push({ 'ducks': [mb2, mb1], type: 'flipV' });

  // rotate 180
  mb1 = flipH(mb1);
  mb2 = flipH(mb2);
  equivalentPositions.push({ 'ducks': [mb1, mb2], type: 'rotate180' });
  equivalentPositions.push({ 'ducks': [mb2, mb1], type: 'rotate180' });

  // horizontal flip
  mb1 = flipV(mb1);
  mb2 = flipV(mb2);
  equivalentPositions.push({ 'ducks': [mb1, mb2], type: 'flipH' });
  equivalentPositions.push({ 'ducks': [mb2, mb1], type: 'flipH' });

  const pos = equivalentPositions.find(({ ducks: [[r1, c1], [r2, c2]] }) =>
    smartBotOptimalThirdSteps[`${r1};${c1} - ${r2};${c2}`] !== undefined
  );

  if (pos !== undefined) {
    const ducks = pos['ducks'];
    const optimalStep = smartBotOptimalThirdSteps[`${ducks[0][0]};${ducks[0][1]} - ${ducks[1][0]};${ducks[1][1]}`];
    const transformedStep = invertTransformation(
      [optimalStep['row'], optimalStep['col']],
      pos['type']
    );
    return { row: transformedStep[0], col: transformedStep[1] };
  }
  return undefined;
};

const invertTransformation = (stepCoords: Coords, type: TransformationType): Coords => {
  switch (type) {
    case 'original': return stepCoords;
    case 'flipV': return flipV(stepCoords);
    case 'rotate180': return flipV(flipH(stepCoords));
    case 'flipH': return flipH(stepCoords);
  }
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board: Board, amIPlayer: boolean): boolean => {
  if (getAllowedMoves(board).length === 0) {
    return true;
  }

  const allowedPlacesForOther = getAllowedMoves(board);

  const optimalPlaceForOther = allowedPlacesForOther.find(({ row, col }) => {
    const { nextBoard } = moves.placeDuck(board, { events: dummyEvents }, { row, col });
    return isWinningState(nextBoard, !amIPlayer);
  });
  return optimalPlaceForOther === undefined;
};

// see scripts/pre-generate-ai-moves/chess-ducks-optimal-2nd-moves.cjs
const smartBotOptimalSecondSteps: Record<string, Field> = {
  '0;0': { row: 0, col: 6 },
  '0;1': { row: 3, col: 1 },
  '0;2': { row: 3, col: 1 },
  '0;3': { row: 1, col: 6 },
  '0;4': { row: 2, col: 4 },
  '0;5': { row: 2, col: 5 },
  '0;6': { row: 2, col: 2 },
  '1;0': { row: 3, col: 1 },
  '1;1': { row: 3, col: 5 },
  '1;2': { row: 1, col: 0 },
  '1;3': { row: 2, col: 4 },
  '1;4': { row: 3, col: 2 },
  '1;5': { row: 2, col: 0 },
  '1;6': { row: 2, col: 3 },
  '2;0': { row: 3, col: 3 },
  '2;1': { row: 2, col: 4 },
  '2;2': { row: 3, col: 1 },
  '2;3': { row: 3, col: 1 },
  '2;4': { row: 3, col: 3 },
  '2;5': { row: 1, col: 0 },
  '2;6': { row: 3, col: 4 },
  '3;0': { row: 1, col: 4 },
  '3;1': { row: 0, col: 1 },
  '3;2': { row: 2, col: 1 },
  '3;3': { row: 2, col: 4 },
  '3;4': { row: 0, col: 2 },
  '3;5': { row: 2, col: 0 },
  '3;6': { row: 2, col: 5 }
};

// see scripts/pre-generate-ai-moves/chess-ducks-optimal-3rd-moves.cjs
const smartBotOptimalThirdSteps: Record<string, Field> = {
  '0;0 - 0;2': { row: 1, col: 5 },
  '0;0 - 0;3': { row: 3, col: 2 },
  '0;0 - 0;4': { row: 3, col: 0 },
  '0;0 - 0;5': { row: 3, col: 0 },
  '0;0 - 1;2': { row: 0, col: 4 },
  '0;0 - 1;3': { row: 3, col: 0 },
  '0;0 - 1;4': { row: 2, col: 1 },
  '0;0 - 1;5': { row: 3, col: 6 },
  '0;0 - 1;6': { row: 1, col: 2 },
  '0;0 - 2;1': { row: 3, col: 6 },
  '0;0 - 2;2': { row: 3, col: 0 },
  '0;0 - 2;3': { row: 1, col: 5 },
  '0;0 - 2;5': { row: 1, col: 2 },
  '0;0 - 2;6': { row: 3, col: 0 },
  '0;0 - 3;0': { row: 1, col: 5 },
  '0;0 - 3;2': { row: 0, col: 3 },
  '0;0 - 3;4': { row: 3, col: 0 },
  '0;0 - 3;5': { row: 3, col: 0 },
  '0;0 - 3;6': { row: 1, col: 5 },
  '0;2 - 0;4': { row: 2, col: 3 },
  '0;2 - 1;4': { row: 3, col: 3 },
  '0;2 - 1;5': { row: 3, col: 0 },
  '0;2 - 2;1': { row: 1, col: 5 },
  '0;2 - 2;3': { row: 0, col: 6 },
  '0;2 - 2;5': { row: 3, col: 0 },
  '0;2 - 3;2': { row: 1, col: 5 },
  '0;2 - 3;3': { row: 3, col: 0 },
  '0;3 - 1;1': { row: 2, col: 4 },
  '0;3 - 2;0': { row: 2, col: 4 },
  '0;3 - 2;2': { row: 1, col: 5 },
  '1;0 - 1;4': { row: 0, col: 6 },
  '1;1 - 1;3': { row: 3, col: 0 },
  '1;1 - 1;5': { row: 3, col: 6 },
  '1;1 - 2;2': { row: 3, col: 0 },
  '1;1 - 2;3': { row: 0, col: 4 },
  '1;1 - 2;4': { row: 0, col: 3 },
  '1;1 - 2;5': { row: 0, col: 4 }
};
