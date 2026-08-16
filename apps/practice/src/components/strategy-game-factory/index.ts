// The barrel every game imports through. Half of what it hands out now lives in
// `packages/engine` — the rules, the move interpreter and the headless runner,
// which a competition server imports the same way — and this re-exports it so
// no game had to learn where it went. What it offers is unchanged, deliberately:
// the engine's public surface is wider than a game has any use for.
export { resolveVariants, variantKey, runMatch } from 'engine';
export type {
  Phase, Mode, Ctx,
  MoveOutcome, MoveFunction, MoveDefinition, Gameplay, GameMoves, ClientGameMoves,
  StrategyArgs, BotStrategy, BotMove, BoardClientProps,
  Variant, VariantInput,
  MatchMove, MatchResult
} from 'engine';

export { strategyGameFactory } from './strategy-game-factory';
export type { Presentation, StrategyGame, StrategyGameConfig } from './strategy-game-factory';
export { GameBoard } from './game-parts/game-board';
export { useHoverPreview } from './hooks/use-hover-preview';
export { useMoveScopedState } from './hooks/use-move-scoped-state';
export { useDeferredMove } from './hooks/use-deferred-move';
