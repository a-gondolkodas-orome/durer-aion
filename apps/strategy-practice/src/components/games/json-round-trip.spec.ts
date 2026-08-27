import * as games from './index';
import {
  resolveVariants, runMatch,
  type StrategyGame
} from 'strategy-game-factory';
import { SLOW_VARIANTS } from './slow-variants';

// The serialization contract of packages/engine/src/types.ts, swept across
// every registered game: a board must survive JSON.parse(JSON.stringify(x))
// with its behaviour intact, because a competition server persists and
// transports boards as JSON. Checked with toEqual, which is exactly the
// behavioural bar — a dropped `undefined` object member reads back undefined
// either way and passes, while an array hole or a Date collapsing to a string
// does not.
//
// Two halves: every variant's start boards (each curated entry, a few samples
// of each generator), and, for the variants cheap enough to play, one whole
// match — every board a real game produced, and the final engine state, which
// is what a server would snapshot. Slow variants sit the match half out
// (see slow-variants.ts); their boards are still swept.

const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value)) as unknown;

const GENERATOR_SAMPLES = 3;

type Entry = [string, StrategyGame<unknown>];
const entries = Object.entries(games) as Entry[];

const variantCases = entries.flatMap(([name, Game]) => {
  const { defaultVariant, resolvedVariants } = resolveVariants(Game.variants);
  return Game.variants.map((variant, variantIndex) => {
    const resolved = resolvedVariants[variantIndex];
    return {
      name: `${name}[${variantIndex}]`,
      variant,
      gameplay: Game.gameplay,
      // A variant with no start position of its own plays the default one's —
      // resolved exactly as the factory and the plays-to-an-end sweep resolve it.
      generateStartBoard: resolved.generateStartBoard ?? defaultVariant.generateStartBoard!,
      botStrategy: resolved.botStrategy!
    };
  });
});

describe('every start board survives a JSON round trip', () => {
  it('covers every registered game', () => {
    expect(variantCases.length).toBeGreaterThan(100);
  });

  it.each(variantCases)('$name', ({ variant, generateStartBoard }) => {
    // The raw variant still names its curated list (resolution folds it into
    // the generator), so a curated variant is judged on every entry rather
    // than on whichever ones the generator happens to hand out.
    const boards = variant.startBoards ?? Array.from(
      { length: GENERATOR_SAMPLES },
      () => generateStartBoard()
    );
    for (const board of boards) {
      expect(roundTrip(board)).toEqual(board);
    }
  });
});

const matchCases = variantCases.filter(({ name }) => !SLOW_VARIANTS.has(name));

describe('a whole match survives a JSON round trip', () => {
  it.each(matchCases)('$name', ({ gameplay, botStrategy, generateStartBoard }) => {
    const { history, board, winnerIndex } = runMatch({
      gameplay,
      strategies: [botStrategy, botStrategy],
      startBoard: generateStartBoard()
    });

    for (const move of history) {
      expect(roundTrip(move.board)).toEqual(move.board);
    }
    // What a server would snapshot after the last move.
    const finalState = { board, winnerIndex };
    expect(roundTrip(finalState)).toEqual(finalState);
  });
});
