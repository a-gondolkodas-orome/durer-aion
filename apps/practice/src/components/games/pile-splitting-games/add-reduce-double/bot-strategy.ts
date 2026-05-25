import { random, sample, range } from 'lodash';
import type { StrategyArgs } from '../../../game-factory';
import type { Board } from './add-reduce-double';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const validMoves: { pileId: number; pieceCount: number }[] = [];
  for (const pileId of [0, 1]) {
    for (const pieceCount of range(2, board[pileId] + 1, 2)) {
      validMoves.push({ pileId, pieceCount });
    }
  }
  moves.moveHalvedPieces(board, sample(validMoves));
};

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  let pileId, pieceCount;
  if (board[0]-board[1] === -1 || board[0]-board[1] === 0 || board[0]-board[1] === 1) {
    const ran = random(0,1);
    pileId=(board[ran]>1) ? ran : (1 - ran);
    pieceCount = 2 * random(1, board[pileId] / 2);

  } else {
    pileId = (board[0]>board[1]) ? 0 : 1;
    const third = Math.floor((board[pileId]-board[1-pileId]+1)/3);
    pieceCount = 2 * third;
  }

  moves.moveHalvedPieces(board, { pileId, pieceCount });
};
