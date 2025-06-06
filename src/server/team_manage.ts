import { createMatch } from "boardgame.io/internal";
import { nanoid } from "nanoid";
import { getBotCredentials, getGameStartAndEndTime } from "../server";
import { Game, LobbyAPI, Server, StorageAPI } from "boardgame.io";
import { relayNames, strategyNames } from "../server";
import { TeamsRepository } from "./db";
import {
  FinishedMatchStatus,
  InProgressMatchStatus,
  TeamModel,
} from "./entities/model";
import { fetch } from "../socketio_botmoves";

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
    playerID: any; //TODO: fix to correct type
    name: string;
    credentials: string;
}
) => {
  let match = await fetch(db, matchId, { metadata: true });
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
  matchId: string,
  bot_id: string
) => {
  await injectPlayer(db, matchId, {
    playerID: bot_id,
    name: "Bot",
    credentials: getBotCredentials(),
  });
};

/**
 * Cheks if the status of the global timer
 * TODO: implement usage
 * @returns {"WAITING"|"FINISHED"|undefined} - status of global game
 */
export function checkGlobalTime(): "WAITING" | "FINISHED" | undefined {
  const now = new Date();
  const { globalStartAt, globalEndAt } = getGameStartAndEndTime();

  if (now.getTime() < globalStartAt.getTime()) {
    return "WAITING";
  }
  if (globalEndAt.getTime() < now.getTime()) {
    return "FINISHED";
  }
  return undefined;
}

/**
 * Creates a game based on context, and given Game.
 * This is the interface between the API, and BGio components.
 * 
 * @param {Game<any, Record<string, unknown>, any>} game - Game object
 * @param {Server.AppCtx} ctx - Context of the Koa & BGio call
 * @returns {LobbyAPI.CreatedMatch} - MatchID for the created game
 */
export async function createGame(
  game: Game<any, Record<string, unknown>, any>,
  ctx: Server.AppCtx
) {
  const matchID: string = nanoid(11);
  const match = createMatch({
    game,
    numPlayers: 2,
    setupData: undefined,
    unlisted: false,
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

export async function endMatchStatusFromScratch(
  matchId: string,
  ctx: Server.AppCtx
): Promise<FinishedMatchStatus> {
  const currentMatch = await ctx.db.fetch(matchId, { state: true });
  return {
    state: "FINISHED",
    matchID: matchId,
    startAt: new Date(currentMatch.state.G.start),
    endAt: new Date(currentMatch.state.G.end),
    score: currentMatch.state.G.score,
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
    //no start from this point
    return false;
  if (team.pageState === gameType)
    //restart attempt
    return false;
  if (
    team.relayMatch.state === "IN PROGRESS" ||
    team.strategyMatch.state === "IN PROGRESS"
  )
    // they are already playing one game
    return false;
  if (gameType === "STRATEGY" && team.strategyMatch.state === "FINISHED")
    // they are already finished the strategy
    return false;
  if (gameType === 'RELAY' && team.relayMatch.state === 'FINISHED') // they are already finished the relay
    return false;

  //default
  return true;
}

export async function checkStaleMatch(
  team: TeamModel
): Promise<{ isStale: boolean; gameState?: "relayMatch" | "strategyMatch" }> {
  // Find if boardgame match is already timed out, but not registered
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
      `Match teamId is not valid, the match has the following players:${currentMatch.metadata.players}`
    );
  const team: TeamModel | null = (await teams.getTeam({ teamId })) ?? null;
  if (team == null)
    throw new Error(
      `Match team is not found, the match has the following players:${currentMatch.metadata.players}`
    );

  const type = inferenceGameType(currentMatch.metadata.gameName);
  //check if the match is already started. We are allowing to close the gamestate even if teamstate id FINISHED, because it may happen, 
  //that the game is closed before the GBIO backend closes the game. (Even tought it should not happen, and we made some progress to prevent it)
  if (team[type].state === "NOT STARTED")
    throw new Error(
      `The match{${matchId}} is not started yet, you can't close it`
    );
  const mStat = team[type] as InProgressMatchStatus;
  const finishState = await endMatchStatus(mStat, currentMatch.state.G.points);
  console.log(
    `Closing match: ${matchId}, points: ${currentMatch.state.G.points}`
  );
  await team.update({ [type]: finishState });
}

export async function getNewGame(
  ctx: Server.AppCtx,
  teams: TeamsRepository,
  games: Game<any, Record<string, unknown>, any>[],
  gameType: "RELAY" | "STRATEGY"
) {
  const GUID = ctx.params.GUID;
  const team: TeamModel =
    (await teams.getTeam({ teamId: GUID })) ??
    ctx.throw(404, `Team with {id:${GUID}} not found.`);

  //if middelware setup was better understand, this should be in a separated midleware
  const staleInfo = await checkStaleMatch(team);
  if (staleInfo.isStale) {
    await closeMatch(
      (team[staleInfo.gameState!] as InProgressMatchStatus).matchID,
      teams,
      ctx.db
    );
  }

  if (!(await allowedToStart(team, gameType))) {
    ctx.throw(403, "Team is not allowed to start game.");
  }
  //find gameName based on team category
  console.log(team.category);
  const gameName =
    gameType === "RELAY"
      ? relayNames[team.category as keyof typeof relayNames]
      : strategyNames[team.category as keyof typeof strategyNames];

  const game: Game<any, Record<string, unknown>> = games.find(
    (g) => g.name === gameName
  ) ?? ctx.throw(404, "Game " + gameName + " not found");

  return { game, team };
}