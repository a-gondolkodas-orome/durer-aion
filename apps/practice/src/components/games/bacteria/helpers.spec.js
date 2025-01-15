import { distanceFromDangerousAttackZone, isDangerous, moves } from "./helpers";
import { reverse } from 'lodash';

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
    let callMock = false;
    const events = {
      endTurn: () => {},
      endGame: () => { callMock = true; }
    }
    const { nextBoard } = moves.defend(board, { events }, { row: 2, col: 0 });
    expect(nextBoard.bacteria[2][0]).toEqual(1);
    expect(callMock).toBe(false);
  });

  it('defend move ends game if no more bacteria', () => {
    const bacteria = reverse([
      [1, 0, 0],
        [0, 0],
      [0, 0, 0]
    ]);
    const board = { bacteria, goals: [1] };
    let callMock = false;
    const events = {
      endTurn: () => {},
      endGame: () => { callMock = true; }
    }
    moves.defend(board, { events }, { row: 2, col: 0 });
    expect(callMock).toBe(true);
  });
})
