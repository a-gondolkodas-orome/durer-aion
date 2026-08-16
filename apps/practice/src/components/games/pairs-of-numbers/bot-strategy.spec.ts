import { range } from 'lodash';
import { randomBotStrategy, smartBotStrategy } from './bot-strategy';
import { moves, type Board } from './gameplay';
import { botNextMove, makeCtx } from 'test-utils';

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const moveNamed = (board: Board): string =>
  botNextMove(smartBotStrategy({ board, ctx: makeCtx() })).move;

// The bot reads the board alone and never draws, so a single call per position
// is the whole decision.
describe('smartBotStrategy', () => {
  it('subtracts to win as soon as a ≤ b', () => {
    expect(moveNamed([4, 4])).toBe('subtract');
    expect(moveNamed([3, 5])).toBe('subtract');

    // that same subtraction is what ends the game
    expect(moves.subtract.apply([4, 4], asPlayer(0)).gameEnd).toEqual({ winnerIndex: 0 });
    expect(moves.subtract.apply([3, 5], asPlayer(1)).gameEnd).toEqual({ winnerIndex: 1 });
  });

  it('raises b while b < a ≤ 2b, so the opponent cannot subtract to a win', () => {
    expect(moveNamed([7, 4])).toBe('add1');
    expect(moveNamed([8, 4])).toBe('add1');
    expect(moveNamed([5, 3])).toBe('add1');
  });

  // Above 2b the source spells out four parity branches, but they say one thing:
  // subtract iff a is odd. Cover all four so a future simplification has to keep
  // meaning the same.
  describe('above 2b, the decision is the parity of a', () => {
    it('subtracts when a is odd', () => {
      expect(moveNamed([9, 4])).toBe('subtract'); // odd a, even b
      expect(moveNamed([9, 3])).toBe('subtract'); // odd a, odd b
    });

    it('raises b when a is even', () => {
      expect(moveNamed([10, 4])).toBe('add1'); // even a, even b
      expect(moveNamed([8, 3])).toBe('add1');  // even a, odd b
    });
  });
});

describe('randomBotStrategy', () => {
  it('names both moves over repeated draws', () => {
    const seen = new Set(range(40).map(() =>
      botNextMove(randomBotStrategy({ board: [9, 4], ctx: makeCtx() })).move));

    expect(seen).toEqual(new Set(['add1', 'subtract']));
  });
});
