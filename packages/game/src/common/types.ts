import { Ctx, DefaultPluginAPIs, Game, MoveMap, TurnConfig } from "boardgame.io";
import type { LiveGameResult } from "schemas";

// boardgame.io does not export its plugin APIs by name. Taking them off the
// context type it does export keeps this out of the package's build layout,
// which is not an API and can be rearranged by a patch release.
export type RandomAPI = DefaultPluginAPIs['random'];

// boardgame.io's own Game interface defaults its generics to `any`; a caller
// that spells that out trips no-explicit-any on bgio's defaults rather than on
// a choice of ours. One caged alias keeps the ban meaningful everywhere else.
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

/// A practice ("test") game or a scored ("live") one. The team's client sends
/// this as a move argument, so the move checks it against the list at runtime.
export const DIFFICULTIES = ['test', 'live'] as const;
export type Difficulty = typeof DIFFICULTIES[number];

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.some(it => it === value);
}

export interface GameStateMixin extends GameStateTimer {
  firstPlayer: null | PlayerIDType;
  winner: PlayerIDType | "draw" | null;
  difficulty: null | undefined | Difficulty;
  numberOfTries: number;
  numberOfLoss: number;
  winningStreak: number;
  points: number;
  // Every finished live game in order; gameWrapper appends to it, the games
  // never touch it.
  liveResults: LiveGameResult[];
}

/// What winning twice in a row earns, by the live games lost before: the last
/// entry stands for that many losses or more. A team that never wins twice in
/// a row scores 0.
export const STRATEGY_POINTS_BY_LOSSES = [12, 9, 6, 4, 3, 2] as const;

export function strategyPoints(numberOfLoss: number): number {
  return STRATEGY_POINTS_BY_LOSSES[Math.min(numberOfLoss, STRATEGY_POINTS_BY_LOSSES.length - 1)];
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
export type StartingPositionFunction<G> = (_: { G: G & GameStateMixin; ctx: Ctx; playerID: PlayerIDType; random: RandomAPI }) => G;

/// GameWrapper's mixin.
/// setup() is defined here, as it returns G instead of G & WrapperState
interface GameMixin<G> {
  possibleMoves: (G: G, ctx: Ctx, playerID: PlayerIDType) => PossibleMove[];
  setup: SetupFunction<G>,
  // Not called: gameWrapper only tests that the key exists, and a game that
  // defines it skips the bot's `setStartingPosition` and starts without a
  // fresh opening position (#35). The bot sending that move is the working
  // route; see README.md, *Creating a new game*.
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

export type GameType<G> = WrappableGame<G & GameStateMixin> & GameMixin<G>;

/// Allows typing: change ctx.currentPlayer -> currentPlayer(ctx)
export function currentPlayer(ctx: Ctx): PlayerIDType {
  return ctx.currentPlayer as PlayerIDType;
}
