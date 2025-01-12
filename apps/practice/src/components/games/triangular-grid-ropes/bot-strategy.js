import { last, isEqual, sample, shuffle, cloneDeep, tail } from 'lodash';
import {
  getAllowedMoves,
  getTrivialMoves,
  edgeDirection,
  isAllowed,
  mirrorNodes,
  isGameEnd
} from './helpers';

//    0
//   1 2
//  3 4 5
// 6 7 8 9

export const aiBotStrategy = ({ board, ctx, moves }) => {
  const move = getOptimalAiMove({ board, chosenRoleIndex: ctx.chosenRoleIndex });
  moves.stretchRope(board, move);
};

const getOptimalAiMove = ({ board, chosenRoleIndex }) => {
  const allowedMoves = getAllowedMoves(board);
  if (chosenRoleIndex === 1) {
    if (board.length === 0) {
      return sample([{ from: 3, to: 5 }, { from: 1, to: 8 }, { from: 2, to: 7 }]);
    } else {
      const symDir = edgeDirection(board[0]);
      const lastMove = last(board);
      if (edgeDirection(lastMove) === symDir) {
        return allowedMoves.find(e => edgeDirection(e) === symDir);
      } else {
        const mirrorOfLastMove = { from: mirrorNodes[symDir][lastMove.from], to: mirrorNodes[symDir][lastMove.to] };
        if (!isAllowed(board, mirrorOfLastMove)) {
          console.error('Unexpected state, falling back');
          return sample(allowedMoves);
        }
        return mirrorOfLastMove;
      }
    }
  }

  const trivialMoves = getTrivialMoves(board);
  const nonTrivialMoves = allowedMoves.filter(e => {
    return trivialMoves.every(ee => !isEqual(ee, e) && !isEqual({ from: ee.to, to: ee.from }, e));
  });

  if (nonTrivialMoves.length === 0) {
    return sample(allowedMoves);
  }

  if (trivialMoves.length % 2 === 0) {
    const simBoard = [...board, ...trivialMoves];
    const optimalMove = shuffle(nonTrivialMoves).find(e => {
      const boardCopy = cloneDeep(simBoard);
      boardCopy.push(e);
      return isWinningState(boardCopy, false);
    });

    if (optimalMove !== undefined) {
      return optimalMove;
    }
  } else {
    const simBoard = [...board, ...tail(trivialMoves)];
    const optimalMove = shuffle([...nonTrivialMoves, trivialMoves[0]]).find(e => {
      const boardCopy = cloneDeep(simBoard);
      boardCopy.push(e);
      return isWinningState(boardCopy, false);
    });

    if (optimalMove !== undefined) {
      return optimalMove;
    }
  }

  return sample(allowedMoves);
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board, amIFirst) => {
  if (isGameEnd(board)) {
    return true;
  }
  const allowedMoves = getAllowedMoves(board);
  const trivialMoves = getTrivialMoves(board);
  const nonTrivialMoves = allowedMoves.filter(e => {
    return trivialMoves.every(ee => !isEqual(ee, e) && !isEqual({ from: ee.to, to: ee.from }, e));
  });

  if (nonTrivialMoves.length === 0) {
    return trivialMoves.length % 2 === 0;
  }

  if (trivialMoves.length % 2 === 0) {
    const simBoard = [...board, ...trivialMoves];
    const optimalPlaceForOther = nonTrivialMoves.find(e => {
      const boardCopy = cloneDeep(simBoard);
      boardCopy.push(e);
      return isWinningState(boardCopy, !amIFirst);
    });
    return optimalPlaceForOther === undefined;
  } else {
    const simBoard = [...board, ...tail(trivialMoves)];
    const optimalPlaceForOther = [...nonTrivialMoves, trivialMoves[0]].find(e => {
      const boardCopy = cloneDeep(simBoard);
      boardCopy.push(e);
      return isWinningState(boardCopy, !amIFirst);
    });
    return optimalPlaceForOther === undefined;
  }
};
