import { sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { applyMove, getLegalMoves, isTerminal, type Board, type Move, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

// A move wins immediately when it leaves the opponent unable to move (at most
// one non-empty pile remains).
export const isWinningInOneMove = (board: Board, move: Move): boolean =>
  isTerminal(applyMove(board, move));

const oddPiles = (board: Board): number[] =>
  board.map((v, i) => i).filter(i => board[i] % 2 === 1);

// Because the total is even, the number of odd piles is even: either 0 (all
// piles even — type (a)) or 2 (two odd, one even — type (b)). The player to
// move wins exactly from type (b): taking a chip from each of the two odd
// piles leaves three even piles (type (a)) for the opponent, who is then
// forced back into a type (b) position (or has already lost). See the spec
// for an exhaustive minimax check of this characterisation.
export const isWinningBoard = (board: Board): boolean => oddPiles(board).length === 2;

export const getSmartBotMove = (board: Board): Move => {
  const odds = oddPiles(board);
  if (odds.length === 2) return [odds[0], odds[1]];
  // Losing position (all even): every move hands the opponent a winning type
  // (b) position, so we cannot win against optimal play. Play any legal move
  // and hope the opponent slips up.
  return sample(getLegalMoves(board))!;
};

// Test bot: play a random legal move, but grab an immediate one-move win when
// one is available.
export const getRandomBotMove = (board: Board): Move => {
  const moves = getLegalMoves(board);
  const winningNow = moves.filter(m => isWinningInOneMove(board, m));
  return sample(winningNow.length > 0 ? winningNow : moves)!;
};

export const smartBotStrategy: Bot = ({ board }) => {
  const [i, j] = getSmartBotMove(board);
  return { move: 'takeChips', args: [i, j] };
};

export const randomBotStrategy: Bot = ({ board }) => {
  const [i, j] = getRandomBotMove(board);
  return { move: 'takeChips', args: [i, j] };
};
