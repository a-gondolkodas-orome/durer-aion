import * as games from './index';
import {
  resolveVariants, runMatch,
  type BotStrategy, type Gameplay, type StrategyGame
} from '../strategy-game-factory';

// Plays every registered game headlessly, through the real moves, the real
// validators and the real reducer. `runMatch` throws on everything this is
// meant to catch — a bot naming a move the game does not have, a move its own
// `validate` rejects, moves named after the turn ended, and a game that never
// reaches an end — so the assertion is simply that a match completes and names
// a winner.
//
// This is a conformance test for the *game*, not for the bot's judgement:
// whether the smart bot wins from a winning position belongs in the game's own
// bot-strategy spec.

// A variant is listed here only because its bot searches deeply enough to
// dominate the suite's runtime — several cost seconds, and swing by more than
// 10x with the random start board they get. A game's rules are shared by all
// its variants, so a cheap variant covers the same moves, validators and win
// detection; what is lost is the coverage of that bot, which its own spec has.
// Two games have no cheap variant left and so drop out of the sweep entirely:
// AmorAndCupido (a single, searching variant) and TriangularGridRopes15 (both
// variants search). Both have a bot-strategy spec of their own.
const SLOW_VARIANTS = new Set([
  'AmorAndCupido[0]',
  'Bacteria[2]',
  'ChessBishops[1]',
  'ChessDucks[1]',
  'ChessDucks[2]',
  'FiveSquares[1]',
  'RecolouringDiscs[1]',
  'SharkChase5[1]',
  'TriangleCircleGame[1]',
  'TriangularGridRopes[1]',
  'TriangularGridRopes15[0]',
  'TriangularGridRopes15[1]'
]);

// Per variant: play up to MAX_MATCHES boards, stopping early once MATCH_BUDGET_MS
// is spent. A game whose match costs microseconds gets every board; one costing
// tens of milliseconds gets one or two.
const MAX_MATCHES = 8;
const MATCH_BUDGET_MS = 15;

type Case = {
  name: string
  gameplay: Gameplay<unknown>
  generateStartBoard: () => unknown
  botStrategy: BotStrategy<unknown>
};

// Resolved exactly as the factory resolves them, so a variant that inherits its
// bot or its start boards from the default one is swept the way it is played.
const allCases: Case[] = Object.entries(games as Record<string, StrategyGame<unknown>>)
  .flatMap(([name, Game]) => {
    const { defaultVariant, resolvedVariants } = resolveVariants(Game.variants);
    return resolvedVariants.map((variant, variantIndex) => ({
      name: `${name}[${variantIndex}]`,
      gameplay: Game.gameplay,
      generateStartBoard: variant.generateStartBoard ?? defaultVariant.generateStartBoard!,
      botStrategy: variant.botStrategy!
    }));
  });

const cases = allCases.filter(({ name }) => !SLOW_VARIANTS.has(name));

describe('every game plays to a decided end', () => {
  it('covers every registered game', () => {
    expect(allCases.length).toBeGreaterThan(100);
    // a listed variant that no longer exists would silently stop excluding anything
    const known = new Set(allCases.map(c => c.name));
    expect([...SLOW_VARIANTS].filter(name => !known.has(name))).toEqual([]);
    // every game keeps at least one variant in the sweep, except the one noted above
    const covered = new Set(cases.map(c => c.name.replace(/\[\d+\]$/, '')));
    const dropped = [...new Set(allCases.map(c => c.name.replace(/\[\d+\]$/, '')))]
      .filter(game => !covered.has(game));
    expect(dropped).toEqual(['AmorAndCupido', 'TriangularGridRopes15']);
  });

  it.each(cases)('$name', ({ gameplay, generateStartBoard, botStrategy }) => {
    // Start boards are random, so one match samples one line of play. Keep
    // playing fresh boards until the cheap games have had a handful or the
    // budget runs out — which spends the time where matches are cheap instead
    // of on a fixed count that the slowest game would set.
    const deadline = performance.now() + MATCH_BUDGET_MS;
    for (let match = 0; match < MAX_MATCHES; match++) {
      const { winnerIndex } = runMatch({
        gameplay,
        strategies: [botStrategy, botStrategy],
        startBoard: generateStartBoard()
      });
      expect([0, 1]).toContain(winnerIndex);
      if (performance.now() > deadline) break;
    }
  });
});
