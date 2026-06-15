import { minPathToVisitAll, getOptimalArchitectPath } from './bot-strategy';
import type { Board } from './architect-and-bandits-b';

const makeBoard = (architectPosition: number, towers: boolean[], day: number): Board => ({
  architectPosition, towers, day, kmUsedToday: 0
});

const allTowers = () => Array(10).fill(true) as boolean[];
const missingVertex = (v: number) => allTowers().map((t, i) => i === v ? false : t);
const missingVertices = (...vs: number[]) => allTowers().map((t, i) => vs.includes(i) ? false : t);

describe('architect-and-bandits-b minPathToVisitAll (10-cycle)', () => {
  it('returns 0 for no targets', () => {
    expect(minPathToVisitAll(0, [])).toBe(0);
  });

  it('returns CW distance for a single target nearby clockwise', () => {
    expect(minPathToVisitAll(0, [4])).toBe(4);
  });

  it('returns CCW distance when going CCW is shorter', () => {
    // target 7 is CW dist 7 but CCW dist 3
    expect(minPathToVisitAll(0, [7])).toBe(3);
  });

  it('uses split strategy when targets are on opposite sides', () => {
    // targets 1 (CW 1) and 7 (CCW 3): split costs min(2*1+3, 1+2*3)=5, beats all-CW (7)
    expect(minPathToVisitAll(0, [1, 7])).toBe(5);
  });
});

describe('architect-and-bandits-b getOptimalArchitectPath', () => {
  it('day 1: always walks A→B→C→D→E→F', () => {
    expect(getOptimalArchitectPath(makeBoard(0, allTowers(), 1))).toEqual([1, 2, 3, 4, 5]);
  });

  it('day 2, D destroyed: F→G→H→I→J→I (backtrack to stay near D)', () => {
    expect(getOptimalArchitectPath(makeBoard(5, missingVertex(3), 2))).toEqual([6, 7, 8, 9, 8]);
  });

  it('day 2, E destroyed: F→G→H→I→J (stop at J, opposite E)', () => {
    expect(getOptimalArchitectPath(makeBoard(5, missingVertex(4), 2))).toEqual([6, 7, 8, 9]);
  });

  it('day 2, B destroyed: F→G→H→I→J→A (continue full arc)', () => {
    expect(getOptimalArchitectPath(makeBoard(5, missingVertex(1), 2))).toEqual([6, 7, 8, 9, 0]);
  });

  it('day 3, B missing + nearby v2: walks A→B→C→D→E→F to cover all', () => {
    // B(1) from night 1, D(3) from night 2, both ≤ 5 → go CW to F
    expect(getOptimalArchitectPath(makeBoard(0, missingVertices(1, 3), 3))).toEqual([1, 2, 3, 4, 5]);
  });

  it('day 3, C missing + G missing: special backtrack A→B→C→B', () => {
    // C(2) from night 1, G(6) from night 2 — opp of G is B(1), but C is past B
    expect(getOptimalArchitectPath(makeBoard(0, missingVertices(2, 6), 3))).toEqual([1, 2, 1]);
  });
});
