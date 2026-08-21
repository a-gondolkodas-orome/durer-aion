// The React-free half of the strategy-game engine: what a game is, what a move
// does to a match, and how a bot's named turn is played out. Everything here
// runs in a bare node — nothing in the core needs a browser, which is what
// would let a server be the authority on a match (issue #313, the design goal
// the core was extracted around).
//
// The React shell that draws a game and paces a bot's moves is the `./react`
// export.
export type {
  Phase, Mode, Ctx,
  MoveOutcome, MoveFunction, MoveDefinition, Gameplay, GameMoves, ClientGameMoves,
  StrategyArgs, BotStrategy, BotMove, BoardClientProps,
  Variant, VariantInput, Presentation, StrategyGameConfig
} from './types';
export type { I18nString, I18nNode, Language, Translatable, TranslatableNode } from './i18n';

export { resolveVariants, variantKey } from './resolve-variants';
export { runMatch } from './run-match';
export type { MatchResult } from './run-match';
export { playBotTurn } from './play-bot-turn';
export type { MatchMove } from './play-bot-turn';

// The move interpreter and the state it interprets against. A host — the React
// shell or `runMatch` — owns the store and decides what to do with a
// transition; none of that decision lives here.
export { reduceMove } from './reducer';
export { buildCtx } from './build-ctx';
export { createGameStore, createInitialCoreState } from './store';
export type { CoreState } from './store';
export { asBotMoves, isBotTurnUnfinished, unknownMoveMessage } from './bot-turn';
export { stepDelay } from './timing';
export { isDevMode } from './dev-mode';
