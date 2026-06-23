import { isNull, range, sample } from 'lodash';
import { pColor, botColor, inPlacingPhase, isGameEnd, type Board } from './helpers';
import type { StrategyArgs } from '../../../game-factory';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const allowedPlaces = getAllowedPlaces({ board, amIBot: true });
  if (inPlacingPhase(board)) {
    const safePlaces = allowedPlaces.filter(i => !opponentCanWinNext(board, i));
    moves.placePiece(board, sample(safePlaces.length > 0 ? safePlaces : allowedPlaces));
  } else {
    moves.whitenPiece(board, sample(allowedPlaces));
  }
};

const opponentCanWinNext = (board: Board, position) => {
  const boardCopy = [...board];
  boardCopy[position] = botColor;
  return range(0, 9).filter(i => isNull(boardCopy[i])).some(i => {
    const boardCopy2 = [...boardCopy];
    boardCopy2[i] = pColor;
    return isGameEnd(boardCopy2);
  });
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  if (inPlacingPhase(board)) {
    const id = getOptimalBotPlacingPosition(board);
    moves.placePiece(board, id);
  } else {
    const id = getOptimalBotFlippingPosition(board);
    moves.whitenPiece(board, id);
  }
};

const getOptimalBotPlacingPosition = (board: Board) => {
  const allowedPlaces = getAllowedPlaces({ board, amIBot: true });

  if (allowedPlaces.length === 9) return(sample([0, 2, 4, 6, 8]));

  const instantWinningPlace = allowedPlaces.find((i) => {
    const localBoard = [...board];
    localBoard[i] = botColor;
    return isGameEnd(localBoard);
  });
  if (instantWinningPlace !== undefined) return instantWinningPlace;

  const instantDefendingPlace = allowedPlaces.find((i) => {
    const localBoard = [...board];
    localBoard[i] = pColor;
    return isGameEnd(localBoard);
  });
  if (instantDefendingPlace !== undefined) return instantDefendingPlace;

  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = [...board];
    boardCopy[i] = botColor;
    return isWinningState(boardCopy, true);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  return sample(allowedPlaces);
};

const getOptimalBotFlippingPosition = (board: Board) => {
  const allowedPlaces = getAllowedPlaces({ board, amIBot: true });

  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = [...board];
    boardCopy[i] = 'white';
    return isWinningState(boardCopy, true);
  });

  // if you can win symmetrically, try to do so (only for beauty)
  if (optimalPlaces.find(i => i === 4) !== undefined) return 4;
  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  return sample(allowedPlaces);
};

const isWinningStateCache = new Map();

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board: Board, amIBot: boolean) => {
  const key = board.join(',') + '|' + amIBot;
  if (isWinningStateCache.has(key)) return isWinningStateCache.get(key);

  if (isGameEnd(board)) {
    isWinningStateCache.set(key, true);
    return true;
  }

  const allowedPlacesForOther = getAllowedPlaces({ board, amIBot: !amIBot });
  const colorForOther = getNextColor({ board, amIBot: !amIBot });

  const optimalPlaceForOther = allowedPlacesForOther.find(i => {
    const boardCopy = [...board];
    boardCopy[i] = colorForOther;
    return isWinningState(boardCopy, !amIBot);
  });
  const result = optimalPlaceForOther === undefined;
  isWinningStateCache.set(key, result);
  return result;
};

const getAllowedPlaces = ({ board, amIBot }: { board: Board, amIBot: boolean }) => {
  if (inPlacingPhase(board)) {
    return range(0, 9).filter(i => isNull(board[i]));
  }
  const enemyColor = amIBot ? pColor : botColor;
  return range(0, 9).filter(i => board[i] === enemyColor);
};

const getNextColor = ({ board, amIBot }: { board: Board, amIBot: boolean }) => {
  if (inPlacingPhase(board)) {
    return amIBot ? botColor : pColor;
  }
  return 'white';
};
