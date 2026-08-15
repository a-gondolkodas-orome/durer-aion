import type { BotMove, Ctx, MoveOutcome } from './types';

// A miniature game to pin `BotMove` against. Its `apply` signatures are what
// the argument types are derived from, so they are annotated as a real game's
// must be.
const moves = {
  take: {
    apply: (board: number, _: { ctx: Ctx }, count: number): MoveOutcome<number> =>
      ({ nextBoard: board - count })
  },
  swap: {
    apply: (board: number, _: { ctx: Ctx }, from: number, to: number): MoveOutcome<number> =>
      ({ nextBoard: board + from - to })
  },
  pass: {
    apply: (board: number): MoveOutcome<number> => ({ nextBoard: board })
  }
};
type Moves = typeof moves;

// These assertions are checked by `tsc`, not at runtime: each @ts-expect-error
// fails the build if the mistake below it ever starts compiling again.
describe('BotMove pinned to a game', () => {
  it('accepts each move with the arguments its apply takes', () => {
    const named: BotMove<Moves>[] = [
      { move: 'take', args: [2] },
      { move: 'swap', args: [1, 3] },
      { move: 'pass' }
    ];
    expect(named.map(({ move }) => move)).toEqual(Object.keys(moves));
  });

  it('rejects a move the game does not have', () => {
    // @ts-expect-error 'takee' is not one of this game's moves
    const named: BotMove<Moves> = { move: 'takee', args: [2] };
    expect(named.move).toBe('takee');
  });

  it('rejects the wrong number of arguments', () => {
    // @ts-expect-error take() takes exactly one argument
    const tooMany: BotMove<Moves> = { move: 'take', args: [2, 3] };
    // @ts-expect-error swap() takes two
    const tooFew: BotMove<Moves> = { move: 'swap', args: [1] };
    // @ts-expect-error pass() takes none
    const unwanted: BotMove<Moves> = { move: 'pass', args: [1] };
    expect([tooMany, tooFew, unwanted]).toHaveLength(3);
  });

  it('rejects an argument of the wrong type', () => {
    // @ts-expect-error take() takes a number
    const named: BotMove<Moves> = { move: 'take', args: ['2'] };
    expect(named.args).toEqual(['2']);
  });

  it('leaves args unchecked when given only a union of names', () => {
    const named: BotMove<'take' | 'swap'> = { move: 'take', args: ['anything', 1] };
    expect(named.args).toHaveLength(2);
  });
});
