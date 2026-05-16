import { orderBy, random, range, sample, sampleSize, shuffle, sum } from 'lodash';

export const randomBotStrategy = ({ board, moves }) => {
  const { levels, target } = board;

  const win = findImmediateWin(levels, target);
  if (win) { moves.combineTwo(board, win); return; }

  const available = range(3).filter((li) => hasActivePair(levels[li]));
  const li = sample(available);
  const actives = activeSlotIndices(levels[li]);
  moves.combineTwo(board, { levelIdx: li, indices: sampleSize(actives, 2) });
};

export const aiBotStrategy = ({ board, ctx, moves }) => {
  const { levels, target, sortedInitial } = board;

  const win = findImmediateWin(levels, target);
  if (win) { moves.combineTwo(board, win); return; }

  const botIsWinner = isP2WinningPosition(sortedInitial, target) === (ctx.currentPlayer === 1);

  const tryLevel = (levelIdx, order = 'desc') => {
    if (!hasActivePair(levels[levelIdx])) return false;
    const level = levels[levelIdx];
    const indices = orderBy(activeSlotIndices(level), (i) => level[i].value, order).slice(0, 2);
    moves.combineTwo(board, { levelIdx, indices });
    return true;
  };

  if (botIsWinner) {
    if (ctx.currentPlayer === 0) {
      if (tryLevel(1) || tryLevel(0) || tryLevel(2)) return;
    } else {
      if (tryLevel(1) || tryLevel(0, 'asc')) return;
    }
  }

  // TODO: is this optimal if bot does not have winning initial position but
  // other player does not play according to winning strategy?
  for (let li = 0; li < 3; li++) {
    if (tryLevel(li)) return;
  }
};

export const isP2WinningPosition = (sortedInitial, target) => {
  const s = sortedInitial;
  return s[0] + s[1] + s[6] + s[7] < target && s[2] + s[3] + s[4] + s[5] >= target;
};

export const generateStartBoard = (tries = 0) => {
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
  const target = sample(pool)();

  return {
    levels: [
      shuffle(nums).map((n) => ({ value: n, state: 'active' })),
      Array(4).fill(null),
      Array(2).fill(null),
      Array(1).fill(null)
    ],
    target,
    sortedInitial: [...nums]
  };
};

const findImmediateWin = (levels, target) => {
  for (const [levelIdx, level] of levels.entries()) {
    const indices = findWinningPair(level, target);
    if (indices) return { levelIdx, indices };
  }
  return null;
};

const findWinningPair = (level, target) => {
  const actives = activeSlotIndices(level);
  for (let i = 0; i < actives.length; i++) {
    for (let j = i + 1; j < actives.length; j++) {
      if (level[actives[i]].value + level[actives[j]].value >= target) {
        return [actives[i], actives[j]];
      }
    }
  }
  return null;
};

export const hasActivePair = (level) => activeSlotIndices(level).length >= 2;

// Slot states: null = empty placeholder, { value, state:'active'|'consumed' }
const activeSlotIndices = (level) =>
  level.flatMap((s, i) => (s?.state === 'active' ? [i] : []));
