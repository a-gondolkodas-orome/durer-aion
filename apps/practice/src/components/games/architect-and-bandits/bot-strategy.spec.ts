import { minPathToVisitAll, getOptimalArchitectPath } from './bot-strategy';
import type { Board } from './architect-and-bandits';

const makeBoard = (architectPosition: number, towers: boolean[], day: number): Board => ({
  architectPosition, towers, day, kmUsedToday: 0
});

const allTowers = () => Array(8).fill(true) as boolean[];
const missingVertex = (v: number) => allTowers().map((t, i) => i === v ? false : t);

describe('architect-and-bandits minPathToVisitAll (8-cycle)', () => {
  it('returns 0 for no targets', () => {
    expect(minPathToVisitAll(0, [])).toBe(0);
  });

  it('returns CW distance for a single target nearby clockwise', () => {
    expect(minPathToVisitAll(0, [3])).toBe(3);
  });

  it('returns CCW distance when going CCW is shorter', () => {
    // target 5 is CW dist 5 but CCW dist 3
    expect(minPathToVisitAll(0, [5])).toBe(3);
  });

  it('returns max CW distance for two targets both clockwise', () => {
    // go CW past 2, then past 4 — total 4
    expect(minPathToVisitAll(0, [2, 4])).toBe(4);
  });

  it('uses split strategy when targets are on opposite sides', () => {
    // target 1 (CW dist 1) and target 6 (CCW dist 2):
    // split: 1 CW then 2 CCW = 1 + 2*2 = 5, but going 1 CW first costs min(2*1+2, 1+2*2)=4
    expect(minPathToVisitAll(0, [1, 6])).toBe(4);
  });
});

describe('architect-and-bandits getOptimalArchitectPath', () => {
  it('day 1: always walks A→B→C→D→E regardless of towers', () => {
    expect(getOptimalArchitectPath(makeBoard(0, allTowers(), 1))).toEqual([1, 2, 3, 4]);
  });

  it('day 2, C destroyed: E→F→G→H→G (backtrack to stay near C)', () => {
    expect(getOptimalArchitectPath(makeBoard(4, missingVertex(2), 2))).toEqual([5, 6, 7, 6]);
  });

  it('day 2, D destroyed: E→F→G→H (stop at H, opposite D)', () => {
    expect(getOptimalArchitectPath(makeBoard(4, missingVertex(3), 2))).toEqual([5, 6, 7]);
  });

  it('day 2, B destroyed: E→F→G→H→A (continue full arc)', () => {
    expect(getOptimalArchitectPath(makeBoard(4, missingVertex(1), 2))).toEqual([5, 6, 7, 0]);
  });

  it('day 2, A destroyed: E→F→G→H→A (same as B case)', () => {
    expect(getOptimalArchitectPath(makeBoard(4, missingVertex(0), 2))).toEqual([5, 6, 7, 0]);
  });
});
