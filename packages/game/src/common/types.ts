import { Ctx, DefaultPluginAPIs, Game, MoveMap, TurnConfig } from "boardgame.io";

// boardgame.io does not export its plugin APIs by name. Taking them off the
// context type it does export keeps this out of the package's build layout,
// which is not an API and can be rearranged by a patch release.
export type RandomAPI = DefaultPluginAPIs['random'];

// boardgame.io's own Game interface defaults its generics to `any` (quoted
// below); a caller that spells that out trips no-explicit-any on bgio's
// defaults rather than on a choice of ours. One caged alias keeps the ban
// meaningful everywhere else.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBgioGame = Game<any, Record<string, unknown>, any>;

export enum PlayerIDType {
  GUESSER_PLAYER = '0',
  JUDGE_PLAYER = '1',
};
export function otherPlayer(playerID: PlayerIDType): PlayerIDType {
  return playerID === GUESSER_PLAYER ? JUDGE_PLAYER : GUESSER_PLAYER;
}

export const { GUESSER_PLAYER, JUDGE_PLAYER } = PlayerIDType;

export interface GameStateMixin extends GameStateTimer {
  firstPlayer: null | PlayerIDType;
  winner: PlayerIDType | "draw" | null;
  difficulty: null | undefined | string;
  numberOfTries: number;
  numberOfLoss: number;
  winningStreak: number;
  points: number;
}

export interface GameStateTimer {
  millisecondsRemaining: number;
  start: string;
  end: string;
}

export type SetupFunction<G> = () => G;
export type StartingPositionFunction<G> = (_: {G: G & GameStateMixin; ctx: Ctx; playerID: PlayerIDType; random: RandomAPI}) => G;

/// GameWrapper's mixin.
/// setup() is defined here, as it returns G instead of G & WrapperState 
interface GameMixin<G> {
  // Implementations disagree on the element shape (some return bgio
  // AiEnumerate entries, the 15o games raw numbers); unknown[] states only
  // what is common. gamewrapper adapts it for bgio's ai.enumerate.
  possibleMoves: (G: G, ctx: Ctx, playerID: PlayerIDType) => unknown[];
  setup: SetupFunction<G>,
  startingPosition?: StartingPositionFunction<G>;
}

/// Base structure, passed through directly to boardgame.io.
interface WrappableGame<G = unknown, PluginAPIs extends Record<string, unknown> = Record<string, unknown>> {
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
