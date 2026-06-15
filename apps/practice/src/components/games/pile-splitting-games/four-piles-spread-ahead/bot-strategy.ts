import { random, sample, range } from 'lodash';
import type { StrategyArgs } from '../../../game-factory';
import type { Board } from './four-piles-spread-ahead';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const validMoves: { pileId: number; pieceCount: number }[] = [];
  for (const pileId of [1, 2, 3]) {
    for (const pieceCount of range(1, Math.min(pileId, board[pileId]) + 1)) {
      validMoves.push({ pileId, pieceCount });
    }
  }
  return moves.spreadPieces(board, sample(validMoves));
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const { pileId, pieceId } = getSmartBotStep(board);
  return moves.spreadPieces(board, { pileId, pieceCount: pieceId + 1 });
};

export const getSmartBotStep = (board: Board): { pileId: number; pieceId: number } => {
  if ((board[1] % 2 === 0) && (board[3] % 5 === 3)) {
    return { pileId: 3, pieceId: random(0, 1) };
  } else if ((board[1] % 2 === 0) && (board[3] % 5 === 4)) {
    return { pileId: 3, pieceId: 2 };
  } else if ((board[1] % 2 === 0) && (board[3] % 5 === 1)) {
    while (true) {
      const pileId = random(1, 3);
      if (board[pileId] > 0) {
        const pieceId = (pileId === 2) && (board[pileId] > 1) ? random(0, 1) : 0;
        return { pileId, pieceId };
      }
    }
  } else if ((board[1] % 2 === 1) && (board[3] % 5 === 3)) {
    return { pileId: 3, pieceId: 2 };
  } else if ((board[1] % 2 === 1) && (board[3] % 5 === 4)) {
    return { pileId: 3, pieceId: 1 };
  } else if ((board[1] % 2 === 1) && (board[3] % 5 === 0)) {
    if (board[3] > 2) {
      while (true) {
        const pileId = random(1, 3);
        if (board[pileId] > 0) {
          if (pileId === 3) return { pileId, pieceId: 2 };
          if (pileId === 1) return { pileId, pieceId: 0 };
          return { pileId, pieceId: board[pileId] > 1 ? random(0, 1) : 0 };
        }
      }
    } else {
      while (true) {
        const pileId = random(1, 2);
        if (board[pileId] > 0) {
          if (pileId === 1) return { pileId, pieceId: 0 };
          return { pileId, pieceId: board[pileId] > 1 ? random(0, 1) : 0 };
        }
      }
    }
  } else if ((board[1] % 2 === 1) && (board[3] % 5 === 2)) {
    while (true) {
      const pileId = random(1, 3);
      if (board[pileId] > 0) {
        if (pileId === 1) return { pileId, pieceId: 0 };
        return { pileId, pieceId: board[pileId] > 1 ? random(0, 1) : 0 };
      }
    }
  } else {
    while (true) {
      const pileId = random(1, 3);
      if (board[pileId] > 0) {
        return { pileId, pieceId: random(0, Math.min(pileId - 1, board[pileId] - 1)) };
      }
    }
  }
};
