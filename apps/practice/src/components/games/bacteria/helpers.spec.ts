import { distanceFromDangerousAttackZone, isDangerous, moves } from "./helpers";
import { reverse } from 'lodash';
import { makeEvents } from '../../../test-utils';

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
    // (1,0) sits on the left half-step: pins leftEdge using floor (not ceil).
    expect(distanceFromDangerousAttackZone(board, { row: 1, col: 0 }).dist).toEqual(0);
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
  it('odd edge is not dangerous unless 1 jump left', () => {
    const bacteria = [
      [0, 0, 0],
        [0, 0],
      [0, 0, 0],
        [0, 0],
      [0, 0, 0]
    ];
    const board = { bacteria, goals: [0, 1, 2] };
    expect(isDangerous(board, { row: 0, col: 0 })).toBe(false);
    // (0,1) is exactly one step (dist 1) from the danger zone: still NOT
    // dangerous. Pins the strict `=== 0` boundary against a `<= 1` slip.
    expect(isDangerous(board, { row: 0, col: 1 })).toBe(false);
    expect(isDangerous(board, { row: 2, col: 0 })).toBe(true);
  });
});

describe('moves', () => {
  it('defend move only removes one bacteria', () => {
    const bacteria = reverse([
      [2, 0, 0],
        [0, 0],
      [0, 0, 0]
    ]);
    const board = { bacteria, goals: [1] };
    const events = makeEvents();
    const { nextBoard } = moves.defend(board, { events }, { row: 2, col: 0 });
    expect(nextBoard.bacteria[2][0]).toEqual(1);
    expect(events.endGame).not.toHaveBeenCalled();
  });

  it('defend move ends game if no more bacteria', () => {
    const bacteria = reverse([
      [1, 0, 0],
        [0, 0],
      [0, 0, 0]
    ]);
    const board = { bacteria, goals: [1] };
    const events = makeEvents();
    moves.defend(board, { events }, { row: 2, col: 0 });
    expect(events.endGame).toHaveBeenCalled();
  });
})
