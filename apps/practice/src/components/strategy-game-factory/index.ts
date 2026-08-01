export { strategyGameFactory, dummyEvents } from './strategy-game-factory';
export type { Presentation, StrategyGameConfig } from './strategy-game-factory';
export type {
  Phase, Mode, Ctx, Events,
  MoveResult, MoveFunction, MoveDefinition, Gameplay, GameMoves,
  StrategyArgs, BoardClientProps,
  Variant, VariantInput
} from './types';
export { GameBoard } from './game-parts/game-board';
export { useHoverPreview } from './hooks/use-hover-preview';
