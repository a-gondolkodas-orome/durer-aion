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

const PLAYER_IDS: readonly string[] = Object.values(PlayerIDType);
// boardgame.io types a player id as a bare `string` — on `ctx.currentPlayer` and on
// the `playerID` a move receives. Every game here is two-player, so the only values
// either can carry are this enum's own; narrowing once, behind a runtime check, is
// what lets the comparison sites stay honest instead of casting at each of them.
// Returns null for anything else, which compares equal to neither player.
export function asPlayerID(playerID: string | null | undefined): PlayerIDType | null {
  return playerID != null && PLAYER_IDS.includes(playerID) ? (playerID as PlayerIDType) : null;
}

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
/// One entry of what `possibleMoves` returns: a move's name and the arguments
/// to call it with. The narrowest of boardgame.io's `AiEnumerate` variants,
/// which is the only one the games and the bots use — the bots index into a
/// move's `args` themselves, so they need it named rather than widened.
export interface PossibleMove {
  move: string;
  args?: unknown[];
}
export type StartingPositionFunction<G> = (_: {G: G & GameStateMixin; ctx: Ctx; playerID: PlayerIDType; random: RandomAPI}) => G;

/// GameWrapper's mixin.
/// setup() is defined here, as it returns G instead of G & WrapperState 
interface GameMixin<G> {
  possibleMoves: (G: G, ctx: Ctx, playerID: PlayerIDType) => PossibleMove[];
  setup: SetupFunction<G>,
  // A game may set its opening position here, or leave it to the bot, which
  // sends it as the `setStartingPosition` move; the live games do the latter.
  // Prefer this one when the position is not the bot's secret: it receives
  // bgio's seeded `random`, so server and client agree on what was drawn,
  // which `Math.random` in a strategy cannot give you. See CLAUDE.md,
  // *Creating a New Game*.
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
