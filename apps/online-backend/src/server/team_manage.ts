import { createMatch } from "boardgame.io/internal";
import { nanoid } from "nanoid";
import { getBotCredentials } from "./common";
import { AnyBgioGame, PlayerIDType } from "game";
import { LobbyAPI, Server, StorageAPI } from "boardgame.io";
import { GameType, RELAY_GAME_NAME, startWindowState, strategyGameName } from "schemas";
import type { CompetitionConfig, ProblemSource } from "schemas";
import { relaySetup } from "../games";
import { BOT_ID, fetch } from "../socketio_botmoves";
import { TeamModel } from "./model";
import { teamMatches, type TeamMatches } from "./match_status";
import { teamStartWindow } from "./start_window";
import { refuse } from "./api_error";

/** Joins a player to a match where the bot's side is not connected.
 * @param db: Database context
 * @param matchID: match id to connect a bot to
 *
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
export const injectPlayer = async (
  db: StorageAPI.Async | StorageAPI.Sync,
  matchId: string,
  {
  playerID,
  name,
    credentials,
}: {
    playerID: PlayerIDType;
    name: string;
    credentials: string;
}
) => {
  const match = await fetch(db, matchId, { metadata: true });
  match.metadata.players[playerID].name = name;
  match.metadata.players[playerID].credentials = credentials;
  match.metadata.players[playerID].isConnected = true;
  await db.setMetadata(matchId, match.metadata);
};

/** Joins a bot to a match where the bot's side is not connected.
 * @param db: Database context
 * @param matchID: match id to connect a bot to
 *
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
export const injectBot = async (
  db: StorageAPI.Async | StorageAPI.Sync,
  matchId: string
) => {
  await injectPlayer(db, matchId, {
    playerID: BOT_ID,
    name: "Bot",
    credentials: getBotCredentials(),
  });
};

/**
 * Creates a game based on context, and given Game.
 * This is the interface between the API, and BGio components.
 *
 * @param {AnyBgioGame} game - Game object
 * @param {Server.AppCtx} ctx - Context of the Koa & BGio call
 * @param setupData - The competition's settings the match is played by
 * @returns {LobbyAPI.CreatedMatch} - MatchID for the created game
 */
export async function createGame(
  game: AnyBgioGame,
  ctx: Server.AppCtx,
  setupData: unknown,
) {
  const matchID: string = nanoid(11);
  const match = createMatch({
    game,
    numPlayers: 2,
    setupData,
    // Kept out of boardgame.io's lobby listing as well as behind the closed
    // `/games` prefix (server/router.ts): the listing carries the metadata,
    // and the team's GUID, which the session cookie carries
    // (server/team_session.ts), is that metadata's player name.
    unlisted: true,
  });

  if ("setupDataError" in match) {
    ctx.throw(400, match.setupDataError);
  } else {
    await ctx.db.createMatch(matchID, match);
  }

  const body: LobbyAPI.CreatedMatch = { matchID };
  return body;
}

/** Whether the team may start a match of `gameType`: one attempt at each
 *  match, never both at once, and only after the disclaimer. */
export function allowedToStart(
  team: Pick<TeamModel, "pageState">,
  matches: TeamMatches,
  gameType: GameType
) {
  if (team.pageState === "DISCLAIMER")
    return false;
  if (team.pageState === gameType)
    return false;
  if (
    matches.relayMatch.state === "IN PROGRESS" ||
    matches.strategyMatch.state === "IN PROGRESS"
  )
    return false;
  const own = gameType === "RELAY" ? matches.relayMatch : matches.strategyMatch;
  return own.state === "NOT STARTED";
}

/** Whether the team may go back to its finished strategy match, to look at
 *  the board as it ended: only from the home page, and not while the relay
 *  runs. */
export function allowedToViewStrategy(
  team: Pick<TeamModel, "pageState">,
  matches: TeamMatches,
) {
  return team.pageState === "HOME"
    && matches.relayMatch.state !== "IN PROGRESS"
    && matches.strategyMatch.state === "FINISHED";
}

/** The game of the team's competition the team asks to start, with what the
 *  match is set up with: the competition's settings as they stand now. A
 *  competition without that match answers 403, as any start the team may not
 *  make does, and so does a start outside the team's start window. Only the
 *  start is checked: a match started in the window runs its full time, and
 *  add-minutes may carry it past `closesAt`. */
export async function getNewGame(
  ctx: Server.AppCtx,
  games: AnyBgioGame[],
  gameType: GameType,
  team: TeamModel,
  competition: CompetitionConfig | undefined,
  problems: ProblemSource,
  now: Date = new Date(),
) {
  if (!allowedToStart(team, await teamMatches(ctx.db, team), gameType)) {
    refuse(ctx, 403, "START_NOT_ALLOWED", "Team is not allowed to start game.");
  }
  const { relay, strategy, languages } = competition
    ?? refuse(ctx, 404, "COMPETITION_NOT_FOUND", "Competition " + team.competitionId + " not found");
  if ((gameType === "RELAY" ? relay : strategy) === undefined) {
    refuse(ctx, 403, "NO_SUCH_MATCH", "The team's competition has no such match.");
  }
  const state = startWindowState(teamStartWindow(team, competition), now);
  if (state !== "open") {
    if (state === "closed") refuse(ctx, 403, "COMPETITION_OVER", "The competition is over.");
    refuse(ctx, 403, "COMPETITION_NOT_STARTED", "The competition has not started yet.");
  }
  const [gameName, setupData] = relay !== undefined && gameType === "RELAY"
    ? [RELAY_GAME_NAME, await relaySetup(relay, languages, problems)]
    : strategy !== undefined && gameType === "STRATEGY"
      ? [strategyGameName(strategy.gameId), { durationMinutes: strategy.durationMinutes }]
      : refuse(ctx, 403, "NO_SUCH_MATCH", "The team's competition has no such match.");

  const game: AnyBgioGame = games.find(
    (g) => g.name === gameName
  ) ?? refuse(ctx, 404, "GAME_NOT_FOUND", "Game " + gameName + " not found");

  return { game, team, setupData };
}
