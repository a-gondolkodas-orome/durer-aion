import { orderBy, range, sample, sampleSize } from 'lodash';
import type { BotMove, BotStrategy } from '../../strategy-game-factory';
import {
  activeSlotIndices, applyMoveToBoard, hasActivePair, type Board, type Level, type Moves
} from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const randomBotStrategy: Bot = ({ board }) => {
  const win = findImmediateWin(board);
  if (win) return { move: 'combineTwo', args: [win] };

  const available = range(3).filter((li) => hasActivePair(board.levels[li]));
  const li = sample(available)!;
  const actives = activeSlotIndices(board.levels[li]);
  return { move: 'combineTwo', args: [{ levelIdx: li, indices: sampleSize(actives, 2) }] };
};

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const win = findImmediateWin(board);
  if (win) return { move: 'combineTwo', args: [win] };

  const botIsWinner = isP2WinningPosition(board) === (ctx.currentPlayer === 1);

  const tryLevel = (levelIdx, order: 'asc' | 'desc' = 'desc'): BotMove<Moves> | null => {
    if (!hasActivePair(board.levels[levelIdx])) return null;
    const level = board.levels[levelIdx];
    const indices = orderBy(activeSlotIndices(level), (i) => level[i]!.value, order).slice(0, 2);
    return { move: 'combineTwo', args: [{ levelIdx, indices }] };
  };

  if (botIsWinner) {
    const preferred = ctx.currentPlayer === 0
      ? tryLevel(1) ?? tryLevel(0) ?? tryLevel(2)
      : tryLevel(1) ?? tryLevel(0, 'asc');
    if (preferred) return preferred;
  }

  for (let li = 0; li < 3; li++) {
    const actives = activeSlotIndices(board.levels[li]);
    for (let i = 0; i < actives.length; i++) {
      for (let j = i + 1; j < actives.length; j++) {
        const { nextBoard } = applyMoveToBoard(board, li, [actives[i], actives[j]]);
        if (!canWin(nextBoard)) {
          return { move: 'combineTwo', args: [{ levelIdx: li, indices: [actives[i], actives[j]] }] };
        }
      }
    }
  }
  return range(3).map(li => tryLevel(li)).find(move => move !== null)!;
};

export const isP2WinningPosition = ({ sortedInitial, target }: Board): boolean => {
  const s = sortedInitial;
  return s[0] + s[1] + s[6] + s[7] < target && s[2] + s[3] + s[4] + s[5] >= target;
};

const findImmediateWin = ({ levels, target }: Board) => {
  for (const [levelIdx, level] of levels.entries()) {
    const indices = findWinningPair(level, target);
    if (indices) return { levelIdx, indices };
  }
  return null;
};

const findWinningPair = (level: Level, target: number) => {
  const actives = activeSlotIndices(level);
  for (let i = 0; i < actives.length; i++) {
    for (let j = i + 1; j < actives.length; j++) {
      if (level[actives[i]]!.value + level[actives[j]]!.value >= target) {
        return [actives[i], actives[j]];
      }
    }
  }
  return null;
};

const canWin = (board: Board): boolean => {
  for (let li = 0; li < 3; li++) {
    const actives = activeSlotIndices(board.levels[li]);
    for (let i = 0; i < actives.length; i++) {
      for (let j = i + 1; j < actives.length; j++) {
        const total = board.levels[li][actives[i]]!.value + board.levels[li][actives[j]]!.value;
        if (total >= board.target) return true;
        const { nextBoard } = applyMoveToBoard(board, li, [actives[i], actives[j]]);
        if (!canWin(nextBoard)) return true;
      }
    }
  }
  return false;
};
