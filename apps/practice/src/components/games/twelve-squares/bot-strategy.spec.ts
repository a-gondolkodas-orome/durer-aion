import { range, uniq } from 'lodash';
import { optimalBotStrategy, randomBotStrategy } from './bot-strategy';
import { moves, type Board } from './gameplay';
import { botNextMoveArgs, makeCtx, moveValidator } from 'test-utils';

// Only the distance between the pieces decides anything — which piece a step
// moves is the mover's business, and the bot never asks.
const gap = (n: number): Board => ({ left: 1, right: 1 + n });

const asPlayer = (currentPlayer: number) => ({ ctx: makeCtx({ currentPlayer }) });

const isValidStep = moveValidator(moves.step);

const stepNamed = (board: Board, currentPlayer = 0): number =>
  botNextMoveArgs(optimalBotStrategy({ board, ctx: makeCtx({ currentPlayer }) }))[0];

// A player loses exactly when the gap they face is ≡ 2 (mod 3): stepping one or
// two hands the opponent a gap of 0 or 1 (mod 3), from which they can restore
// the remainder. So the whole strategy is "leave a gap ≡ 2 (mod 3)", and the
// bot is right iff every step it names does that.
describe('optimalBotStrategy', () => {
  it('jumps over the opponent when the gap is one', () => {
    expect(stepNamed(gap(1))).toBe(2);

    const outcome = moves.step.apply(gap(1), asPlayer(0), 2);
    expect(outcome.gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('takes the only legal step when the gap is two', () => {
    // Stepping two would land on the opponent, which the rule forbids.
    expect(stepNamed(gap(2))).toBe(1);
  });

  it.each([
    [3, 1], [4, 2], [6, 1], [7, 2], [9, 1], [10, 2]
  ])('steps %i → %i, leaving a gap ≡ 2 (mod 3)', (from, step) => {
    expect(stepNamed(gap(from))).toBe(step);
    expect((from - step) % 3).toBe(2);
  });

  it.each([5, 8, 11])('plays on from the lost gap %i without a rule to follow', lost => {
    // Nothing wins from here, so the bot only owes a legal step — but it must
    // not freeze on one either, and both remain open at these gaps.
    const seen = new Set(range(40).map(() => stepNamed(gap(lost))));
    expect(seen).toEqual(new Set([1, 2]));
  });

  it('reads the gap alone, so both seats are told the same step', () => {
    // Only over the gaps it decides: on a lost gap it draws, and two calls can
    // differ there for reasons that have nothing to do with the seat.
    for (const distance of range(1, 12).filter(d => d <= 2 || d % 3 !== 2)) {
      expect(stepNamed(gap(distance), 1)).toBe(stepNamed(gap(distance), 0));
    }
  });

  it('converts a won gap into a win along a forced line', () => {
    // Gap 4: the bot steps two, and from there the opponent has exactly one
    // legal reply at each turn, so the rest of the game plays itself.
    let board = gap(4);
    expect(stepNamed(board)).toBe(2);
    board = moves.step.apply(board, asPlayer(0), 2).nextBoard;
    expect(board.right - board.left).toBe(2);

    // the opponent's only legal step
    expect(isValidStep(board, 2)).toBe(false);
    board = moves.step.apply(board, asPlayer(1), 1).nextBoard;
    expect(board.right - board.left).toBe(1);

    expect(stepNamed(board)).toBe(2);
    expect(moves.step.apply(board, asPlayer(0), 2).gameEnd).toEqual({ winnerIndex: 0 });
  });

  it('never names the step that would land on the opponent', () => {
    // The bot draws at random on the losing gaps, so one call per gap proves
    // little; the illegal step is a different one at every distance.
    const illegal = range(1, 12).flatMap(distance =>
      range(20)
        .map(() => stepNamed(gap(distance)))
        .filter(step => !isValidStep(gap(distance), step))
        .map(step => `gap ${distance} -> ${step}`));

    expect(uniq(illegal)).toEqual([]);
  });
});

describe('randomBotStrategy', () => {
  it('draws only from the legal steps', () => {
    const illegal = range(1, 12).flatMap(distance =>
      range(20)
        .map(() => botNextMoveArgs(randomBotStrategy({ board: gap(distance), ctx: makeCtx() }))[0])
        .filter(step => !isValidStep(gap(distance), step))
        .map(step => `gap ${distance} -> ${step}`));

    expect(uniq(illegal)).toEqual([]);
  });

  it('always names the single legal step at a gap of two', () => {
    const seen = new Set(range(20).map(() =>
      botNextMoveArgs(randomBotStrategy({ board: gap(2), ctx: makeCtx() }))[0]));

    expect(seen).toEqual(new Set([1]));
  });
});
