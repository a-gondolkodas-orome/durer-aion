import { sample } from 'lodash';
import { type BotStrategy } from 'strategy-game-factory';
import { createWinLossSolver } from '../shared/win-loss-solver';
import { type Board, type Moves, legalNodes } from './gameplay';

type Bot = BotStrategy<Board, Moves>

const addCoin = (board: Board, node: number): Board => {
  const next = board.slice();
  next[node] += 1;
  return next;
};

// Every move raises the total coin count by exactly 1, so the game is a strictly
// monotonic DAG — the solver's precondition — and the player who places the last
// coin wins, which is the normal play the solver assumes.
const { isWinningForMover, winningMoves } = createWinLossSolver<Board, number>({
  key: (board) => board.join(','),
  legalMoves: legalNodes,
  apply: addCoin
});

export { isWinningForMover };

// From a winning position, play any move that keeps the win. From a losing
// position (opponent playing optimally would win), play the move that leaves the
// opponent the fewest winning replies, so a fallible human is most likely to
// slip. Ties are broken randomly.
export const getBotMove = (board: Board): number => {
  const winning = winningMoves(board);
  if (winning.length > 0) return sample(winning)!;

  const nodes = legalNodes(board);
  const trapCount = (node: number) => winningMoves(addCoin(board, node)).length;
  const fewestReplies = Math.min(...nodes.map(trapCount));
  return sample(nodes.filter((node) => trapCount(node) === fewestReplies))!;
};

export const smartBotStrategy: Bot = ({ board }) =>
  ({ move: 'placeCoin', args: [getBotMove(board)] });
