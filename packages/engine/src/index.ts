// The React-free half of the strategy-game engine: what a game is, what a move
// does to a match, and how a bot's named turn is played out. Everything here
// runs in a bare node, which is what lets a competition server be the authority
// on a match rather than a browser (issue #313).
//
// The React shell that draws a game and paces a bot's moves is still in
// apps/practice; it moves in behind a `./react` export next.
export type {
  Phase, Mode, Ctx,
  MoveOutcome, MoveFunction, MoveDefinition, Gameplay, GameMoves, ClientGameMoves,
  StrategyArgs, BotStrategy, BotMove, BoardClientProps,
  Variant, VariantInput
} from './types';
export type { I18nString, I18nNode, Language, Translatable, TranslatableNode } from './i18n';

export { resolveVariants, variantKey, startBoardForAttempt } from './resolve-variants';
export { runMatch } from './run-match';
export type { MatchResult } from './run-match';
export { playBotTurn } from './play-bot-turn';
export type { MatchMove } from './play-bot-turn';
export { applyClientMove } from './apply-client-move';
export type { ClientMoveRejection, ClientMoveResult } from './apply-client-move';

// The move interpreter and the state it interprets against. A host — the React
// shell, `runMatch`, or the server routes Phase 3 adds — owns the store and
// decides what to do with a transition; none of that decision lives here.
export { reduceMove } from './reducer';
export { buildCtx } from './build-ctx';
export { createGameStore, createInitialCoreState } from './store';
export type { CoreState } from './store';
export { asBotMoves, isBotTurnUnfinished, unknownMoveMessage } from './bot-turn';
export { stepDelay } from './timing';
export { isDevMode } from './dev-mode';
