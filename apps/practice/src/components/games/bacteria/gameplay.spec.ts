import {
  moves, applyAttackMove, totalBacteria,
  hasBacterium, isAttackAllowed, ATTACKER, DEFENDER, type MoveType
} from './gameplay';
import { reverse } from 'lodash';
import { makeCtx } from '../../../test-utils';

describe('moves', () => {
  const meta = { ctx: makeCtx({ currentPlayer: DEFENDER }) };
  const attackerMeta = { ctx: makeCtx({ currentPlayer: ATTACKER }) };

  it('defend move only removes one bacteria', () => {
    const bacteria = reverse([
      [2, 0, 0],
        [0, 0],
      [0, 0, 0]
    ]);
    const board = { bacteria, goals: [1] };
    const outcome = moves.defend.apply(board, meta, { row: 2, col: 0 });
    expect(outcome.nextBoard.bacteria[2][0]).toEqual(1);
    expect(outcome.gameEnd).toBeUndefined();
  });

  it('defend move ends game if no more bacteria', () => {
    const bacteria = reverse([
      [1, 0, 0],
        [0, 0],
      [0, 0, 0]
    ]);
    const board = { bacteria, goals: [1] };
    const outcome = moves.defend.apply(board, meta, { row: 2, col: 0 });
    expect(outcome.gameEnd).toEqual({ winnerIndex: DEFENDER });
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
      const viaMoves = moves[type].apply(makeBoard(), attackerMeta, { row: 2, col: 1 });
      expect(viaMoves.nextBoard.bacteria).toEqual(nextBoard.bacteria);
      if (reachedGoal) {
        expect(viaMoves.gameEnd).toEqual({ winnerIndex: ATTACKER });
      } else {
        expect(viaMoves.gameEnd).toBeUndefined();
      }
    }
  });
})

// The rule moves and divides a whole cell at once: a shift takes *all* the
// bacteria of the cell one step sideways, and a division sends a copy of *every*
// bacterium on it to each of the two cells ahead — doubling the stack. Every
// other test here uses a single bacterium, where "all of them" and "one of them"
// are indistinguishable.
describe('a whole cell moves at once', () => {
  const withStack = (count: number) => ({
    bacteria: [
      [0, count, 0],
        [0, 0],
      [0, 0, 0]
    ],
    goals: [1]
  });

  it('shifts every bacterium of the cell, not just one', () => {
    const { nextBoard } = applyAttackMove(withStack(4), { type: 'shiftRight', row: 0, col: 1 });
    expect(nextBoard.bacteria[0]).toEqual([0, 0, 4]);
  });

  it('gives each of the division targets a copy of the whole stack', () => {
    // From the wide row 0 the two cells ahead are (1,0) and (1,1), so a stack of
    // three becomes three in each — six bacteria from three.
    const { nextBoard } = applyAttackMove(withStack(3), { type: 'spread', row: 0, col: 1 });
    expect(nextBoard.bacteria[0]).toEqual([0, 0, 0]);
    expect(nextBoard.bacteria[1]).toEqual([3, 3]);
    expect(totalBacteria(nextBoard)).toBe(6);
  });

  it('adds the stack to whatever the target cell already holds', () => {
    const board = {
      bacteria: [
        [0, 2, 0],
          [5, 0],
        [0, 0, 0]
      ],
      goals: [1]
    };
    const { nextBoard } = applyAttackMove(board, { type: 'spread', row: 0, col: 1 });
    expect(nextBoard.bacteria[1]).toEqual([7, 2]);
  });

  it('moves a single bacterium on a jump, however tall the stack', () => {
    const { nextBoard } = applyAttackMove(withStack(4), { type: 'jump', row: 0, col: 1 });
    expect(nextBoard.bacteria[0]).toEqual([0, 3, 0]);
    expect(nextBoard.bacteria[2]).toEqual([0, 1, 0]);
    expect(totalBacteria(nextBoard)).toBe(4);
  });
});

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
});
