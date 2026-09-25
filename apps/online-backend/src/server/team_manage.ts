import { createMatch } from "boardgame.io/internal";
import { nanoid } from "nanoid";
import { getBotCredentials, relayNames } from "./common";
import { AnyBgioGame, PlayerIDType, strategyNames } from "game";
import { LobbyAPI, Server, StorageAPI } from "boardgame.io";
import { TeamsRepository } from "./db";
import {
  FinishedMatchStatus,
  InProgressMatchStatus,
} from "schemas";
import { BOT_ID, fetch } from "../socketio_botmoves";
import { TeamModel } from "./model";

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
  console.log(`Match is indeed empty, and thus in need for a bot!`);
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
 * @returns {LobbyAPI.CreatedMatch} - MatchID for the created game
 */
export async function createGame(
  game: AnyBgioGame,
  ctx: Server.AppCtx
) {
  const matchID: string = nanoid(11);
  const match = createMatch({
    game,
    numPlayers: 2,
    setupData: undefined,
    // A listed match is served by boardgame.io's unauthenticated
    // `GET /games/:name`, metadata included — and the team's GUID, which is
    // what the session cookie carries (server/team_session.ts), is that
    // metadata's player name. Nothing in this codebase reads the lobby
    // listing.
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

export async function startMatchStatus(
  matchId: string,
  ctx: Server.AppCtx
): Promise<InProgressMatchStatus> {
  const currentMatch = await ctx.db.fetch(matchId, { state: true });
  return {
    state: "IN PROGRESS",
    matchID: matchId,
    startAt: new Date(currentMatch.state.G.start),
    endAt: new Date(currentMatch.state.G.end),
  };
}

export async function endMatchStatus(
  progressStatus: InProgressMatchStatus,
  finalScore: number
): Promise<FinishedMatchStatus> {
  return {
    state: "FINISHED",
    matchID: progressStatus.matchID,
    startAt: progressStatus.startAt,
    endAt: progressStatus.endAt,
    score: finalScore,
  };
}

export async function allowedToStart(
  team: TeamModel,
  gameType: "RELAY" | "STRATEGY"
) {
  if (team.pageState === "DISCLAIMER")
    return false;
  if (team.pageState === gameType)
    return false;
  if (
    team.relayMatch.state === "IN PROGRESS" ||
    team.strategyMatch.state === "IN PROGRESS"
  )
    return false;
  if (gameType === "STRATEGY" && team.strategyMatch.state === "FINISHED")
    return false;
  if (gameType === 'RELAY' && team.relayMatch.state === 'FINISHED')
    return false;

  return true;
}

export async function checkStaleMatch(
  team: TeamModel
): Promise<
  | { isStale: false }
  | { isStale: true; gameState: "relayMatch" | "strategyMatch" }
> {
  const now = new Date(Date());
  if (team.relayMatch.state === "IN PROGRESS") {
    if (typeof team.relayMatch.endAt === "string")
      team.relayMatch.endAt = new Date(team.relayMatch.endAt);
    if (team.relayMatch.endAt.getTime() < now.getTime())
      return { isStale: true, gameState: "relayMatch" };
  }

  if (team.strategyMatch.state === "IN PROGRESS") {
    if (typeof team.strategyMatch.endAt === "string")
      team.strategyMatch.endAt = new Date(team.strategyMatch.endAt);
    if (team.strategyMatch.endAt.getTime() < now.getTime())
      return { isStale: true, gameState: "strategyMatch" };
  }

  return { isStale: false };
}

function inferenceGameType(gameName: string) {
  let key: keyof typeof relayNames | keyof typeof strategyNames;
  for (key in relayNames) {
    if (relayNames[key] === gameName) return "relayMatch";
  }
  for (key in strategyNames) {
    if (strategyNames[key] === gameName) return "strategyMatch";
  }
  throw new Error(`Unregistered gamename: ${gameName} `);
}

export async function closeMatch(
  matchId: string,
  teams: TeamsRepository,
  db: StorageAPI.Async | StorageAPI.Sync
) {
  const currentMatch = await db.fetch(matchId, { state: true, metadata: true });
  const teamId = currentMatch.metadata.players[0].name;
  if (!teamId)
    throw new Error(
      `Match teamId is not valid, the match has the following players:${JSON.stringify(currentMatch.metadata.players)}`
    );
  const team: TeamModel | null = (await teams.getTeam({ teamId })) ?? null;
  if (team == null)
    throw new Error(
      `Match team is not found, the match has the following players:${JSON.stringify(currentMatch.metadata.players)}`
    );

  const type = inferenceGameType(currentMatch.metadata.gameName);
  // A FINISHED match is closed again on purpose: the stale check can close it
  // before boardgame.io's game over, the game still scores some late moves, and
  // this overwrites the score copied then.
  const status = team[type];
  // After an admin reset the old match still runs, and reaches game over while
  // the team is NOT STARTED again or already playing its new match. Neither
  // may be closed with the old match's points.
  if (status.state === "NOT STARTED" || status.matchID !== matchId) {
    console.log(
      `Not closing match: ${matchId}, the team's current match is ${status.state === "NOT STARTED" ? "none" : status.matchID}`
    );
    return;
  }
  const mStat = status as InProgressMatchStatus;
  const finishState = await endMatchStatus(mStat, currentMatch.state.G.points);
  console.log(
    `Closing match: ${matchId}, points: ${currentMatch.state.G.points}`
  );
  await team.update({ [type]: finishState });
}

export async function getNewGame(
  ctx: Server.AppCtx,
  teams: TeamsRepository,
  games: AnyBgioGame[],
  gameType: "RELAY" | "STRATEGY",
  team: TeamModel
) {
  //if middleware setup was better understood, this should be in a separate middleware
  const staleInfo = await checkStaleMatch(team);
  if (staleInfo.isStale) {
    await closeMatch(
      (team[staleInfo.gameState] as InProgressMatchStatus).matchID,
      teams,
      ctx.db
    );
  }

  if (!(await allowedToStart(team, gameType))) {
    ctx.throw(403, "Team is not allowed to start game.");
  }
  const gameName =
    gameType === "RELAY"
      ? relayNames[team.category as keyof typeof relayNames]
      : strategyNames[team.category as keyof typeof strategyNames];

  const game: AnyBgioGame = games.find(
    (g) => g.name === gameName
  ) ?? ctx.throw(404, "Game " + gameName + " not found");

  return { game, team };
}
