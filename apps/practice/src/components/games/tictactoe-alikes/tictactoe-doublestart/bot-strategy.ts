import { range, isNull, sample, sampleSize, cloneDeep } from 'lodash';
import { hasWinningSubset } from '../gameplay';
import { hasFirstPlayerWon, isGameEnd, roleColors, type Board, type Moves } from './gameplay';
import type { BotMove, BotStrategy } from '../../../strategy-game-factory';

type Bot = BotStrategy<Board, Moves>

const emptyCells = (board: Board) => range(0, 9).filter(i => isNull(board[i]));

// The opening turn places two pieces, named together as one decision.
const placements = (...cells: (number | undefined)[]): BotMove<Moves>[] =>
  cells.map(cell => ({ move: 'placePiece', args: [cell] }));

export const randomBotStrategy: Bot = ({ board }) => {
  const allowedPlaces = emptyCells(board);
  if (allowedPlaces.length < 9) return placements(sample(allowedPlaces));
  const [first, second] = sampleSize(allowedPlaces, 2);
  return placements(first, second);
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  if (emptyCells(board).length === 9) {
    // two neighbouring corners, chosen randomly
    const opening = sample([[0, 2], [2, 8], [6, 8], [0, 6]])!;
    return placements(opening[0], opening[1]);
  }
  return placements(getOptimalBotPlacingPosition(board, ctx.chosenRoleIndex));
};

const getOptimalBotPlacingPosition = (board: Board, chosenRoleIndex) => {
  const botColor = roleColors[1 - chosenRoleIndex];
  const opponentColor = roleColors[chosenRoleIndex];

  const allowedPlaces = emptyCells(board);

  const optimalPlaces = allowedPlaces.filter(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = botColor;
    return isWinningState(boardCopy, chosenRoleIndex === 1);
  });

  if (optimalPlaces.length > 0) return sample(optimalPlaces);

  // even if we are gonna lose, try to prolong it
  const opponentPieces = range(0, 9).filter(i => board[i] === opponentColor);
  const defendingPlaces = allowedPlaces.filter(i => hasWinningSubset([...opponentPieces, i]));
  if (defendingPlaces.length > 0) return sample(defendingPlaces);

  return sample(allowedPlaces);
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board: Board, amIFirst) => {
  if (isGameEnd(board)) {
    return amIFirst === hasFirstPlayerWon(board);
  }
  const opponentColor = roleColors[amIFirst ? 1 : 0];

  const optimalPlaceForOther = emptyCells(board).find(i => {
    const boardCopy = cloneDeep(board);
    boardCopy[i] = opponentColor;
    return isWinningState(boardCopy, !amIFirst);
  });
  return optimalPlaceForOther === undefined;
};
