import { sample } from "lodash";
import { type StrategyArgs } from "../../game-factory";
import { type Board, legalNodes, hasAnyMove } from "./helpers";

// Every move raises the total coin count by exactly 1, so the game is a strictly
// monotonic DAG: it always terminates and can be solved exactly by a memoized
// minimax. A position is winning for the player to move iff some legal move leads
// to a position that is losing for the opponent. A player with no legal move
// loses (the player who placed the last coin wins).
const addCoin = (board: Board, node: number): Board => {
  const next = board.slice();
  next[node] += 1;
  return next;
};

const memo = new Map<string, boolean>();

export const isWinningForMover = (board: Board): boolean => {
  const key = board.join(",");
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  const nodes = legalNodes(board);
  const result = nodes.some((node) => !isWinningForMover(addCoin(board, node)));
  memo.set(key, result);
  return result;
};

const winningMoves = (board: Board): number[] =>
  legalNodes(board).filter((node) => !isWinningForMover(addCoin(board, node)));

// A move that leaves no legal move behind places the last coin, immediately
// winning the game for the mover.
const winningInOneMove = (board: Board): number[] =>
  legalNodes(board).filter((node) => !hasAnyMove(addCoin(board, node)));

// Test bot: plays a random legal move, but grabs an immediate one-move win if one
// is available.
export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const instantWins = winningInOneMove(board);
  const node = instantWins.length > 0 ? sample(instantWins)! : sample(legalNodes(board))!;
  moves.placeCoin(board, node);
};

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

export const smartBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  moves.placeCoin(board, getBotMove(board));
};
