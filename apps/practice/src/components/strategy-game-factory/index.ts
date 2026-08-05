export { strategyGameFactory } from './strategy-game-factory';
export type { Presentation, StrategyGame, StrategyGameConfig } from './strategy-game-factory';
export type {
  Phase, Mode, Ctx,
  MoveOutcome, MoveFunction, MoveDefinition, Gameplay, GameMoves, ClientGameMoves,
  StrategyArgs, BotStrategy, BotMove, BoardClientProps,
  Variant, VariantInput
} from './types';
export { runMatch } from './engine/run-match';
export type { MatchMove, MatchResult } from './engine/run-match';
export { GameBoard } from './game-parts/game-board';
export { useHoverPreview } from './hooks/use-hover-preview';
export { useMoveScopedState } from './hooks/use-move-scoped-state';
export { useDeferredMove } from './hooks/use-deferred-move';
