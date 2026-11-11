import { Ctx, DefaultPluginAPIs, Game, MoveMap, TurnConfig } from "boardgame.io";
import type { LiveGameResult, Localizable } from "schemas";

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
  // Every live game in order; gameWrapper's play phase appends to it and says
  // when a game cut off by the time is included. The games never touch it.
  liveResults: LiveGameResult[];
}

// `satisfies` makes this list exhaustive and exact: a key added to the mixin
// and missing here, or one here that the mixin lacks, fails the typecheck.
const GAME_STATE_MIXIN_KEYS: ReadonlySet<string> = new Set(Object.keys({
  millisecondsRemaining: true,
  start: true,
  end: true,
  firstPlayer: true,
  winner: true,
  difficulty: true,
  numberOfTries: true,
  numberOfLoss: true,
  winningStreak: true,
  points: true,
  liveResults: true,
} satisfies Record<keyof GameStateMixin, true>));

/// A starting position arrives as a move argument and is merged into `G`, so
/// it must be an object naming only the game's own keys: one naming a mixin
/// key would rewrite the score or the clock.
export function isOwnGameState(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && Object.keys(value).every(key => !GAME_STATE_MIXIN_KEYS.has(key));
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

/// What a bot answers in the `startNewGame` phase: the opening position of the
/// next game, which only the game's own half of the state may make up.
export type StartingPositionMove<G> = [[G], 'setStartingPosition'];

export function startingPositionMove<G>(position: G): StartingPositionMove<G> {
  return [[position], 'setStartingPosition'];
}

/// What the strategy wrapper says around a game's board that only the game
/// knows. It sits with the rules rather than the board, so the server and the
/// bot read the same game the screen describes; a step that depends on part of
/// a move is a move of its own, kept in `G`, for the description to read. Each
/// text is one for every language or one per language the game lists
/// (`strategyGames`).
export interface GamePresentation<G> {
  /// The two roles, the first player's first: on the buttons the team chooses
  /// with, and wherever the screen says which one it chose. So each is a short
  /// noun phrase naming the role ("Kezdő (2 X)", "Cápa"), not a sentence about
  /// the choice. Without them the roles are only who starts, worded by the
  /// wrapper.
  roleLabels?: readonly [Localizable<string>, Localizable<string>];
  /// What the team does next on its turn in `play`, as the practice site's
  /// game of the same name says it.
  getPlayerStepDescription?: (args: { G: G & GameStateMixin, ctx: Ctx }) => Localizable<string>;
}

/// GameWrapper's mixin.
/// setup() is defined here, as it returns G instead of G & WrapperState
interface GameMixin<G> extends GamePresentation<G> {
  possibleMoves: (G: G, ctx: Ctx, playerID: PlayerIDType) => PossibleMove[];
  setup: SetupFunction<G>,
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
