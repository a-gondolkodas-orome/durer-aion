import { random, sample, range } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import type { Board, Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  const validMoves: { pileId: number; pieceCount: number }[] = [];
  for (const pileId of [0, 1]) {
    for (const pieceCount of range(2, board[pileId] + 1, 2)) {
      validMoves.push({ pileId, pieceCount });
    }
  }
  return { move: 'moveHalvedPieces', args: [sample(validMoves)!] };
};

export const getSmartBotStep = (board: Board): { pileId: number; pieceCount: number } => {
  let pileId: number, pieceCount: number;
  if (board[0]-board[1] === -1 || board[0]-board[1] === 0 || board[0]-board[1] === 1) {
    const ran = random(0,1);
    pileId=(board[ran]>1) ? ran : (1 - ran);
    // `random` returns a float if either bound is one, and an odd pile halves
    // to a float — which would name an illegal fractional transfer.
    pieceCount = 2 * random(1, Math.floor(board[pileId] / 2));
  } else {
    pileId = (board[0]>board[1]) ? 0 : 1;
    const third = Math.floor((board[pileId]-board[1-pileId]+1)/3);
    pieceCount = 2 * third;
  }
  return { pileId, pieceCount };
};

export const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'moveHalvedPieces', args: [getSmartBotStep(board)] });
