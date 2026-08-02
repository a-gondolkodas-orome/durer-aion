import {
  distanceFromDangerousAttackZone, isDangerous, moves, applyAttackMove,
  hasBacterium, isAttackAllowed, type MoveType
} from "./helpers";
import { legalAttackMoves } from "./bot-strategy";
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
    const { nextBoard } = moves.defend.legacyApply(board, { events }, { row: 2, col: 0 });
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
    moves.defend.legacyApply(board, { events }, { row: 2, col: 0 });
    expect(events.endGame).toHaveBeenCalled();
  });

  // The real game (moves) and the bot's look-ahead (applyAttackMove) must apply
  // identical mechanics; locking them together prevents silent divergence.
  it('each attacker move matches the shared applyAttackMove', () => {
    // (2,1) can shiftLeft, shiftRight, jump (to 4,1) and spread (to 3,0 / 3,1).
    const makeBoard = () => ({
      bacteria: [
        [0, 0, 0],
          [0, 0],
        [0, 1, 0],
          [0, 0],
        [0, 0, 0]
      ],
      goals: [1]
    });
    const types: MoveType[] = ['shiftRight', 'shiftLeft', 'jump', 'spread'];
    for (const type of types) {
      const { nextBoard, reachedGoal } = applyAttackMove(makeBoard(), { type, row: 2, col: 1 });
      const events = makeEvents();
      const viaMoves = moves[type].legacyApply(makeBoard(), { events }, { row: 2, col: 1 });
      expect(viaMoves.nextBoard.bacteria).toEqual(nextBoard.bacteria);
      if (reachedGoal) {
        expect(events.endGame).toHaveBeenCalled();
      } else {
        expect(events.endGame).not.toHaveBeenCalled();
      }
    }
  });
})

describe('legality', () => {
  // Three rows: wide (3), narrow (2), wide (3). A single bacterium sits in the
  // middle of the bottom row.
  const board = {
    bacteria: [
      [0, 1, 0],
       [0, 0],
      [0, 0, 0]
    ],
    goals: [1]
  };

  it('requires a bacterium on the cell every move starts from', () => {
    expect(hasBacterium(board, { row: 0, col: 1 })).toBe(true);
    expect(hasBacterium(board, { row: 0, col: 0 })).toBe(false);
    expect(hasBacterium(board, { row: 9, col: 0 })).toBe(false);
    expect(hasBacterium(board, { row: 0, col: -1 })).toBe(false);
  });

  it('allows the attacks that stay on the board', () => {
    expect(isAttackAllowed(board, { type: 'shiftLeft', row: 0, col: 1 })).toBe(true);
    expect(isAttackAllowed(board, { type: 'shiftRight', row: 0, col: 1 })).toBe(true);
    expect(isAttackAllowed(board, { type: 'jump', row: 0, col: 1 })).toBe(true);
    expect(isAttackAllowed(board, { type: 'spread', row: 0, col: 1 })).toBe(true);
  });

  it('refuses a shift off the side of the row', () => {
    const atEdge = { ...board, bacteria: [[1, 0, 0], [0, 0], [0, 0, 0]] };
    expect(isAttackAllowed(atEdge, { type: 'shiftLeft', row: 0, col: 0 })).toBe(false);
    expect(isAttackAllowed(atEdge, { type: 'shiftRight', row: 0, col: 0 })).toBe(true);
  });

  it('refuses a jump or a division that would leave the board', () => {
    // Top row: nothing above it, so neither a jump nor a division has anywhere
    // to go. Without this a division would silently delete the bacteria.
    const onTop = { ...board, bacteria: [[0, 0, 0], [0, 0], [0, 1, 0]] };
    expect(isAttackAllowed(onTop, { type: 'jump', row: 2, col: 1 })).toBe(false);
    expect(isAttackAllowed(onTop, { type: 'spread', row: 2, col: 1 })).toBe(false);
    expect(isAttackAllowed(onTop, { type: 'shiftLeft', row: 2, col: 1 })).toBe(true);
  });

  it('refuses any attack from a cell with no bacteria', () => {
    for (const type of ['shiftLeft', 'shiftRight', 'jump', 'spread'] as MoveType[]) {
      expect(isAttackAllowed(board, { type, row: 0, col: 0 })).toBe(false);
    }
  });

  it('accepts every move the bot enumerates', () => {
    const busy = { ...board, bacteria: [[1, 2, 1], [3, 0], [0, 1, 0]] };
    expect(legalAttackMoves(busy).length).toBeGreaterThan(0);
    expect(legalAttackMoves(busy).every(m => isAttackAllowed(busy, m))).toBe(true);
  });
});
