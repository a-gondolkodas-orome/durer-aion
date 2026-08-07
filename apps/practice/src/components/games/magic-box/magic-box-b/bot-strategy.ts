import { range, sample } from 'lodash';
import { LINES, emptyCellsInLine, isLineFull, placeStoneAt, type Board, type Moves } from './gameplay';
import type { BotMove, BotStrategy } from 'strategy-game-factory';

type Bot = BotStrategy<Board, Moves>

// A turn is one decision — where to place, then which line to hand over — so it
// is named as a whole. The opening turn has no pending line to place into.
const asTurn = (pendingLine: number | null, cell: number | undefined, line: number): BotMove<Moves>[] =>
  pendingLine === null
    ? [{ move: 'designateLine', args: [line] }]
    : [{ move: 'placeStone', args: [cell!] }, { move: 'designateLine', args: [line] }];

export const randomBotStrategy: Bot = ({ board }) => {
  const { stones, pendingLine } = board;
  return asTurn(
    pendingLine,
    pendingLine === null ? undefined : sample(emptyCellsInLine(stones, pendingLine)),
    sample(range(LINES.length))!
  );
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const { cell, line } = getOptimalAction(board, ctx.chosenRoleIndex);
  return asTurn(board.pendingLine, cell, line);
};

const winnerCache = new Map<string, number>();

const cacheKey = (stones: boolean[], pendingLine: number | null) => `${stones.join('')}|${pendingLine}`;

// given it is toMove's turn at this state, who wins the rest of the game with optimal play?
const winner = (stones: boolean[], pendingLine: number | null, toMove: number): number => {
  const key = cacheKey(stones, pendingLine);
  const cached = winnerCache.get(key);
  if (cached !== undefined) return cached;

  if (pendingLine !== null && isLineFull(stones, pendingLine)) {
    winnerCache.set(key, 1 - toMove);
    return 1 - toMove;
  }

  const placementOptions = pendingLine === null
    ? [stones]
    : emptyCellsInLine(stones, pendingLine).map(cell => placeStoneAt(stones, cell));

  let result = 1 - toMove;
  search: for (const newStones of placementOptions) {
    for (let line = 0; line < LINES.length; line++) {
      if (isLineFull(newStones, line) || winner(newStones, line, 1 - toMove) === toMove) {
        result = toMove;
        break search;
      }
    }
  }

  winnerCache.set(key, result);
  return result;
};

export const getOptimalAction = (board: Board, chosenRoleIndex) => {
  const { stones, pendingLine } = board;
  const placementCells = pendingLine === null ? [undefined] : emptyCellsInLine(stones, pendingLine);

  for (const cell of placementCells) {
    const newStones = cell === undefined ? stones : placeStoneAt(stones, cell);
    for (let line = 0; line < LINES.length; line++) {
      if (isLineFull(newStones, line) || winner(newStones, line, 1 - chosenRoleIndex) === chosenRoleIndex) {
        return { cell, line };
      }
    }
  }

  const fallbackLine: number = sample(range(LINES.length))!;
  return { cell: sample(placementCells), line: fallbackLine };
};
