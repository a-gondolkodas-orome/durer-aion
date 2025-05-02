import { Ctx, MoveMap, TurnConfig } from "boardgame.io";

export enum PlayerIDType {
  GUESSER_PLAYER = '0',
  JUDGE_PLAYER = '1',
};
export function otherPlayer(playerID: PlayerIDType): PlayerIDType {
  return playerID === GUESSER_PLAYER ? JUDGE_PLAYER : GUESSER_PLAYER;
}

export const { GUESSER_PLAYER, JUDGE_PLAYER } = PlayerIDType;
export interface GameStateMixin {
  firstPlayer: null | PlayerIDType;
  winner: PlayerIDType | "draw" | null;
  difficulty: null | undefined | string;
  numberOfTries: number;
  numberOfLoss: number;
  winningStreak: number;
  points: number;
  millisecondsRemaining: number;
  start: string;
  end: string;
}

export type SetupFunction<G> = () => G;
export type StartingPositionFunction<G> = (_: {G: G & GameStateMixin; ctx: Ctx; playerID: PlayerIDType; random: any}) => G;

/// GameWrapper's mixin.
/// setup() is defined here, as it returns G instead of G & WrapperState 
interface GameMixin<G> {
  possibleMoves: (G: G, ctx: Ctx, playerID: PlayerIDType) => any[];
  setup: SetupFunction<G>,
  startingPosition?: StartingPositionFunction<G>;
}

/// Base structure, passed through directly to boardgame.io.
interface WrappableGame<G extends any = any, PluginAPIs extends Record<string, unknown> = Record<string, unknown>> {
  name?: string;
  minPlayers?: number;
  maxPlayers?: number;
  moves?: MoveMap<G, PluginAPIs>;
  turn?: TurnConfig<G, PluginAPIs>;
}

/* Game Interface fragment for reference (bitch.)
export interface Game<
  G extends any = any,
  PluginAPIs extends Record<string, unknown> = Record<string, unknown>,
  SetupData extends any = any
> {
  name?: string;
  minPlayers?: number;
  maxPlayers?: number;
  setup?: (
    context: PluginAPIs & DefaultPluginAPIs & { ctx: Ctx },
    setupData?: SetupData
  ) => G;
  moves?: MoveMap<G, PluginAPIs>;
  turn?: TurnConfig<G, PluginAPIs>;
}
*/

export type GameType<G> = WrappableGame<G & GameStateMixin> & GameMixin<G>;

/// Allows typing: change ctx.currentPlayer -> currentPlayer(ctx)
export function currentPlayer(ctx: Ctx): PlayerIDType {
  return ctx.currentPlayer as PlayerIDType;
}
