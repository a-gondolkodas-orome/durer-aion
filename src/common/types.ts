import { Ctx, MoveMap, TurnConfig } from "boardgame.io";

export type PlayerIDType = "0" | "1";

export interface GameStateMixin {
  firstPlayer: null | 0 | 1;
  winner: PlayerIDType | "draw" | null;
  difficulty: null | undefined | string;
  numberOfTries: number;
  numberOfLoss: number;
  winningStreak: number;
  points: number;
}

/// GameWrapper's mixin.
/// setup() is defined here, as it returns G instead of G & WrapperState 
interface GameMixin<MixG,G> {
  possibleMoves: (G: G, ctx: Ctx, playerID: PlayerIDType) => any[];
  setup: () => G,
  startingPosition?: (_: {G: MixG; ctx: Ctx; playerID: PlayerIDType; random: any}) => G;
}

/// Base structure, passed through directly to boardgame.io.
interface WrappableGame<G extends any = any, PluginAPIs extends Record<string, unknown> = Record<string, unknown>> {
  name?: string;
  minPlayers?: number;
  maxPlayers?: number;
  moves?: MoveMap<G, PluginAPIs>;
  turn?: TurnConfig<G, PluginAPIs>;
}

export type GameType<G> = WrappableGame<G & GameStateMixin> & GameMixin<G & GameStateMixin,G>;

/// Allows typing: change ctx.currentPlayer -> currentPlayer(ctx)
export function currentPlayer(ctx: Ctx): "0" | "1" {
  return ctx.currentPlayer as "0" | "1";
}
