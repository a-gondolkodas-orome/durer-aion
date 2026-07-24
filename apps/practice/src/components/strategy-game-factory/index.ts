export { strategyGameFactory, dummyEvents } from './strategy-game-factory';
export type { Presentation, Gameplay, StrategyGameConfig } from './strategy-game-factory';
export type {
  Phase, Mode, Ctx, Events,
  MoveResult, MoveFunction, GameMoves,
  StrategyArgs, BoardClientProps,
  Variant, VariantInput
} from './types';
export { makeCtx } from './helpers/make-ctx';
export { GameBoard } from './game-parts/game-board';
export { useHoverPreview } from './hooks/use-hover-preview';
