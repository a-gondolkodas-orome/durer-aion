export { strategyGameFactory } from './strategy-game-factory';
export type { Presentation, StrategyGameConfig } from './strategy-game-factory';
export type {
  Phase, Mode, Ctx,
  MoveOutcome, MoveFunction, MoveDefinition, Gameplay, GameMoves, ClientGameMoves,
  StrategyArgs, BoardClientProps,
  Variant, VariantInput
} from './types';
export { GameBoard } from './game-parts/game-board';
export { useHoverPreview } from './hooks/use-hover-preview';
