import { range, sample } from 'lodash';
import { isLineFull, emptyCellsInLine, placeStoneAt, LINES, type Board } from './helpers';
import type { StrategyArgs } from '../../game-factory';

export const randomBotStrategy = ({ board, moves }: StrategyArgs<Board>) => {
  const { stones, pendingLine } = board;
  if (pendingLine !== null) {
    const cell = sample(emptyCellsInLine(stones, pendingLine));
    const { nextBoard } = moves.placeStone(board, cell);
    setTimeout(() => moves.designateLine(nextBoard, sample(range(LINES.length))), 700);
  } else {
    moves.designateLine(board, sample(range(LINES.length)));
  }
};

export const smartBotStrategy = ({ board, ctx, moves }: StrategyArgs<Board>) => {
  const { cell, line } = getOptimalAction(board, ctx.chosenRoleIndex);
  if (board.pendingLine !== null) {
    const { nextBoard } = moves.placeStone(board, cell);
    setTimeout(() => moves.designateLine(nextBoard, line), 700);
  } else {
    moves.designateLine(board, line);
  }
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
