import { range, sample } from 'lodash';
import { isGameEnd, placeStone, type Board, type Moves } from './gameplay';
import type { BotStrategy } from 'strategy-game-factory';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) =>
  ({ move: 'placeStone', args: [sample(emptyCells(board))!] });

const emptyCells = (board: Board) => range(0, 9).filter(i => !board[i]);

const winnerCache = new Map<string, number>();

// given it is someone's turn at this board (no full line yet), which player wins with optimal play?
// The winner depends on whose turn it is as well as on the board, so both go in
// the key: the same board is evaluated for either player, and a stale entry from
// the other player's search would answer the wrong question.
const winner = (board: Board, toMove: number): number => {
  const key = `${board.join('')}|${toMove}`;
  const cached = winnerCache.get(key);
  if (cached !== undefined) return cached;

  const result = emptyCells(board).some(i => {
    const nextBoard = placeStone(board, i);
    const outcome = isGameEnd(nextBoard) ? 1 - toMove : winner(nextBoard, 1 - toMove);
    return outcome === toMove;
  }) ? toMove : 1 - toMove;

  winnerCache.set(key, result);
  return result;
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const chosenRoleIndex = ctx.chosenRoleIndex!;
  const allowedPlaces = emptyCells(board);

  const winningPlaces = allowedPlaces.filter(i => {
    const nextBoard = placeStone(board, i);
    const outcome = isGameEnd(nextBoard) ? 1 - chosenRoleIndex : winner(nextBoard, 1 - chosenRoleIndex);
    return outcome === chosenRoleIndex;
  });
  if (winningPlaces.length > 0) return { move: 'placeStone', args: [sample(winningPlaces)!] };

  // no winning move exists; at least avoid losing immediately if possible
  const notInstantLosingPlaces = allowedPlaces.filter(i => !isGameEnd(placeStone(board, i)));
  if (notInstantLosingPlaces.length > 0) {
    return { move: 'placeStone', args: [sample(notInstantLosingPlaces)!] };
  }

  return { move: 'placeStone', args: [sample(allowedPlaces)!] };
};
