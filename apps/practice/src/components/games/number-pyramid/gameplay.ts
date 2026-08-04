import { random, sample, shuffle, sum } from 'lodash';
import type { Ctx, MoveOutcome } from '../../strategy-game-factory';

export type Slot = { value: number; state: 'active' | 'consumed' };
export type Level = (Slot | null)[];
export type Board = {
  levels: Level[];
  target: number;
  sortedInitial: number[];
};

export const generateStartBoard = (tries = 0): Board => {
  if (tries >= 100) throw new Error('generateStartBoard: too many retries');
  const nums = Array.from({ length: 8 }, () => random(2, 15));
  nums.sort((a, b) => b - a);
  const extremes = nums[0] + nums[1] + nums[6] + nums[7];
  const innerSum = nums[2] + nums[3] + nums[4] + nums[5];
  const total = sum(nums);
  const topTwo = nums[0] + nums[1];

  const p2Gens = extremes < innerSum ? [() => random(extremes + 1, innerSum)] : [];
  const p1Gens = [() => random(innerSum + 1, total)];
  const lowerP1Max = Math.min(extremes, innerSum);
  if (topTwo + 1 <= lowerP1Max) p1Gens.push(() => random(topTwo + 1, lowerP1Max));

  const pool = random(0, 1) === 0 ? p2Gens : p1Gens;
  if (pool.length === 0) return generateStartBoard(tries + 1);
  const target = sample(pool)!();

  return {
    levels: [
      shuffle(nums).map((n): Slot => ({ value: n, state: 'active' })),
      Array(4).fill(null),
      Array(2).fill(null),
      Array(1).fill(null)
    ],
    target,
    sortedInitial: [...nums]
  };
};

export const moves = {
  combineTwo: {
    validate: (board: Board, _, move) => isCombineAllowed(board, move),
    apply: (
      board: Board,
      { ctx }: { ctx: Ctx },
      { levelIdx, indices }
    ): MoveOutcome<Board> => {
      const { nextBoard, combinedValue } = applyMoveToBoard(board, levelIdx, indices);

      // nextTurnState clears the half-made selection the BoardClient parked in
      // ctx.turnState while the player was picking the second slot.
      if (combinedValue >= board.target) {
        return { nextBoard, nextTurnState: null, gameEnd: { winnerIndex: ctx.currentPlayer! } };
      }
      return { nextBoard, nextTurnState: null, isTurnEnd: true };
    }
  }
};

export type Moves = typeof moves;

export const hasActivePair = (level: Level): boolean => activeSlotIndices(level).length >= 2;

export const applyMoveToBoard = (
  board: Board, levelIdx: number, indices: number[]
): { nextBoard: Board; combinedValue: number } => {
  const newLevels = board.levels.map(level => [...level]);
  const level = newLevels[levelIdx];
  const combinedValue = indices.reduce((acc, i) => acc + (level[i] as Slot).value, 0);
  indices.forEach(i => { level[i] = { ...(level[i] as Slot), state: 'consumed' }; });
  const emptyIdx = newLevels[levelIdx + 1].indexOf(null);
  newLevels[levelIdx + 1][emptyIdx] = { value: combinedValue, state: 'active' };
  return { nextBoard: { ...board, levels: newLevels }, combinedValue };
};

// Slot states: null = empty placeholder, { value, state:'active'|'consumed' }
export const activeSlotIndices = (level: Level): number[] =>
  level.flatMap((s, i) => (s?.state === 'active' ? [i] : []));

// A move erases two distinct numbers that are still active on one level and
// writes their sum one level up — so the level must have a level above it.
// Both players combine on the same pyramid, so whose turn it is does not enter
// into legality.

// A move erases two distinct numbers that are still active on one level and
// writes their sum one level up — so the level must have a level above it.
// Both players combine on the same pyramid, so whose turn it is does not enter
// into legality.
export const isCombineAllowed = (board: Board, move: { levelIdx: number; indices: number[] }): boolean => {
  if (!move) return false;
  const { levelIdx, indices } = move;
  if (!Number.isInteger(levelIdx) || levelIdx < 0 || levelIdx >= board.levels.length - 1) return false;
  if (!Array.isArray(indices) || indices.length !== 2 || indices[0] === indices[1]) return false;
  const actives = activeSlotIndices(board.levels[levelIdx]);
  return indices.every(i => actives.includes(i));
};
