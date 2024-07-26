import { distanceFromDangerousAttackZone, isDangerous } from "./helpers";

describe('distanceFromDangerousAttackZone', () => {
  it('returns 0 for winning attack position', () => {
    const bacteria = [
      [0, 0, 0],
        [0, 0],
      [0, 0, 0]
    ];
    const board = { bacteria, goals: [1] };
    expect(distanceFromDangerousAttackZone(board, { row: 2, col: 1 }).dist).toEqual(0);
    expect(distanceFromDangerousAttackZone(board, { row: 2, col: 0 }).dist).toEqual(0);
    expect(distanceFromDangerousAttackZone(board, { row: 1, col: 1 }).dist).toEqual(0);
    expect(distanceFromDangerousAttackZone(board, { row: 0, col: 1 }).dist).toEqual(0);
  });

  it('returns distance for losing attack position', () => {
    const bacteria = [
      [0, 0, 0],
       [0, 0],
      [0, 0, 0]
    ];
    const board = { bacteria, goals: [0] };
    expect(distanceFromDangerousAttackZone(board, { row: 2, col: 1 }).dist).toEqual(0);
    expect(distanceFromDangerousAttackZone(board, { row: 2, col: 2 }).dist).toEqual(1);
    expect(distanceFromDangerousAttackZone(board, { row: 1, col: 1 }).dist).toEqual(1);
    expect(distanceFromDangerousAttackZone(board, { row: 0, col: 2 }).dist).toEqual(2);
  });
});

describe('isDangerous', () => {
  it('odd edge is not dangerous', () => {
    const bacteria = [
      [0, 0, 0],
        [0, 0],
      [0, 0, 0]
    ];
    const board = { bacteria, goals: [0, 1, 2] };
    expect(isDangerous(board, { row: 0, col: 0 })).toBe(false);
  });
});
