import { sample } from 'lodash';
import type { BotStrategy } from '../../strategy-game-factory';
import {
  applyMove,
  getLegalMoves,
  isWinningBoard,
  isWinningInOneMove,
  type Board,
  type Move,
  type Moves
} from './gameplay';

type Bot = BotStrategy<Board, Moves>

// A position is losing for the player to move exactly when the three smallest
// piles are equal, so a winning move is one that hands the opponent such a
// position. `isWinningBoard` (in gameplay.ts, where generateStartBoard needs it)
// is the same predicate the other way round.
const handsOverALoss = (board: Board, move: Move): boolean =>
  !isWinningBoard(applyMove(board, move));

export const getSmartBotMove = (board: Board): Move => {
  // Winning moves leave the opponent with three equal smallest piles (a losing
  // position). Immediate wins (leaving the opponent unable to move) are a
  // special case, so prefer them to end the game promptly.
  const winning = getLegalMoves(board).filter(m => handsOverALoss(board, m));
  const immediate = winning.filter(m => isWinningInOneMove(board, m));
  if (immediate.length > 0) return sample(immediate)!;
  if (winning.length > 0) return sample(winning)!;
  // Losing position (three smallest already equal): every move hands the
  // opponent a winning position, so we cannot win against optimal play. Play
  // any legal move and hope the opponent slips up.
  return sample(getLegalMoves(board))!;
};

// Test bot: play a random legal move, but grab an immediate one-move win when
// one is available.
export const getRandomBotMove = (board: Board): Move => {
  const moves = getLegalMoves(board);
  const winningNow = moves.filter(m => isWinningInOneMove(board, m));
  return sample(winningNow.length > 0 ? winningNow : moves)!;
};

export const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'takeStones', args: [getSmartBotMove(board)] });

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'takeStones', args: [getRandomBotMove(board)] });
