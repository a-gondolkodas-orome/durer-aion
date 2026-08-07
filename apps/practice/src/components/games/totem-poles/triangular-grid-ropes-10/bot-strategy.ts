import { last, isEqual, sample, shuffle, cloneDeep, tail } from 'lodash';
import {
  edgeDirection,
  getAllowedMoves,
  getTrivialMoves,
  isAllowed,
  isGameEnd,
  mirrorNodes,
  type Board,
  type Edge,
  type Moves
} from './gameplay';
import type { BotStrategy } from '../../../strategy-game-factory';
import { reportUnexpectedState } from '../../shared/unexpected-state';

type Bot = BotStrategy<Board, Moves>

//    0
//   1 2
//  3 4 5
// 6 7 8 9

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'stretchRope', args: [sample(getAllowedMoves(board))!] });

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const allowedMoves = getAllowedMoves(board);
  if (ctx.chosenRoleIndex === 1) {
    if (board.length === 0) {
      const opening = sample([{ from: 3, to: 5 }, { from: 1, to: 8 }, { from: 2, to: 7 }])!;
      return { move: 'stretchRope', args: [opening] };
    } else {
      const symDir = edgeDirection(board[0]!)!;
      const lastMove = last(board)!;
      if (edgeDirection(lastMove) === symDir) {
        // The mirroring strategy keeps the position symmetric, so an edge in
        // the symmetry direction is still free whenever the opponent just took one.
        return { move: 'stretchRope', args: [allowedMoves.find(e => edgeDirection(e) === symDir)!] };
      } else {
        const mirrorOfLastMove: Edge = {
          from: mirrorNodes[symDir][lastMove.from],
          to: mirrorNodes[symDir][lastMove.to]
        };
        if (!isAllowed(board, mirrorOfLastMove)) {
          // The position is symmetric before the opponent moves, so the mirror
          // of their move is free by construction — a taken one means the
          // mirroring bookkeeping is wrong, not that the game reached it.
          reportUnexpectedState(
            `triangular-grid-ropes-10: mirror of ${JSON.stringify(lastMove)} already taken`
          );
          return { move: 'stretchRope', args: [sample(allowedMoves)!] };
        }
        return { move: 'stretchRope', args: [mirrorOfLastMove] };
      }
    }
  }

  const trivialMoves = getTrivialMoves(board);
  const nonTrivialMoves = allowedMoves.filter(e => {
    return trivialMoves.every(ee => !isEqual(ee, e) && !isEqual({ from: ee.to, to: ee.from }, e));
  });

  if (nonTrivialMoves.length === 0) {
    return { move: 'stretchRope', args: [sample(allowedMoves)!] };
  }

  if (trivialMoves.length % 2 === 0) {
    const simBoard = [...board, ...trivialMoves];
    const optimalMove = shuffle(nonTrivialMoves).find(e => {
      const boardCopy = cloneDeep(simBoard);
      boardCopy.push(e);
      return isWinningState(boardCopy, false);
    });

    if (optimalMove !== undefined) {
      return { move: 'stretchRope', args: [optimalMove] };
    }
  } else {
    const simBoard = [...board, ...tail(trivialMoves)];
    const optimalMove = shuffle([...nonTrivialMoves, trivialMoves[0]]).find(e => {
      const boardCopy = cloneDeep(simBoard);
      boardCopy.push(e);
      return isWinningState(boardCopy, false);
    });

    if (optimalMove !== undefined) {
      return { move: 'stretchRope', args: [optimalMove] };
    }
  }

  return { move: 'stretchRope', args: [sample(allowedMoves)!] };
};

// given board *after* your step, are you set up to win the game for sure?
const isWinningState = (board: Board, amIFirst) => {
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
