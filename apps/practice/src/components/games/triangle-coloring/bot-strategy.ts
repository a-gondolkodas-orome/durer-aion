import type { BotStrategy } from '../../strategy-game-factory';
import { sample, shuffle } from 'lodash';
import { getAllowedMoves, withTriangleColored, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'colorTriangle', args: [sample(getAllowedMoves(board))!] });

export const smartBotStrategy: Bot = ({ board }) => {
  const allowedMoves = getAllowedMoves(board);
  const optimalPlace = shuffle(allowedMoves).find(
    i => isWinningState(withTriangleColored(board, i))
  );

  return { move: 'colorTriangle', args: [optimalPlace ?? sample(allowedMoves)!] };
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board: Board) => {
  const allowedPlacesForOther = getAllowedMoves(board);
  if (allowedPlacesForOther.length === 0) {
    return true;
  }

  const optimalPlaceForOther = allowedPlacesForOther.find(
    i => isWinningState(withTriangleColored(board, i))
  );
  return optimalPlaceForOther === undefined;
};
