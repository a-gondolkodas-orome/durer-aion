import { PostgresStore } from "bgio-postgres";
import { Async, Sync } from "boardgame.io/internal";
import { Game, Server, StorageAPI } from "boardgame.io";
import { relayNames, strategyNames } from "../server";
import { TeamsRepository } from "./db";
import { FinishedMatchStatus, InProgressMatchStatus, TeamModel } from "./entities/model";

export async function startMatchStatus(matchId: string, ctx: Server.AppCtx): Promise<InProgressMatchStatus> {
  const currentMatch = await ctx.db.fetch(matchId, { state: true });
  return {
    state: 'IN PROGRESS',
    matchID: matchId,
    startAt: new Date(currentMatch.state.G.start),
    endAt: new Date(currentMatch.state.G.end),
  }
}

export async function endMatchStatusFromScratch(matchId: string, ctx: Server.AppCtx): Promise<FinishedMatchStatus> {
  const currentMatch = await ctx.db.fetch(matchId, { state: true });
  return {
    state: 'FINISHED',
    matchID: matchId,
    startAt: new Date(currentMatch.state.G.start),
    endAt: new Date(currentMatch.state.G.end),
    score: currentMatch.state.G.score,
  }
}

export async function endMatchStatus(progressStatus: InProgressMatchStatus, finalScore: number): Promise<FinishedMatchStatus> {
  return {
    state: 'FINISHED',
    matchID: progressStatus.matchID,
    startAt: progressStatus.startAt,
    endAt: progressStatus.endAt,
    score: finalScore,
  }
}

export async function allowedToStart(team: TeamModel, gameType: 'RELAY' | 'STRATEGY') {
  if (team.pageState === 'HOME') // no one played before
    return true;
  if (team.pageState === 'FINISHED') //no return from this point
    return false;
  if (team.pageState === 'DISCLAIMER') //no start from this point
    return false;
  if (team.pageState === gameType) //restart attempt
    return false;
  if (team.relayMatch.state === 'IN PROGRESS' || team.strategyMatch.state === 'IN PROGRESS') // they are already playing one game
    return false;

  //default
  return true;
}

export async function checkStaleMatch(team: TeamModel): Promise<{ isStale: boolean, gameState?: 'relayMatch' | 'strategyMatch' }> {
  // Find if boardgame match is already timed out, but not registered
  const now = new Date(Date());
  console.log(`Stale check performed at: ${now}/${Date()}`)
  if (team.relayMatch.state === 'IN PROGRESS'){
    if(typeof team.relayMatch.endAt === 'string')
      team.relayMatch.endAt = new Date(team.relayMatch.endAt);
    console.log(typeof team.relayMatch.endAt,team.relayMatch.endAt,now)
    console.log(team.relayMatch.endAt.getTime() , now.getTime())
    if (team.relayMatch.endAt.getTime() < now.getTime())
      return { isStale: true, gameState: 'relayMatch' };
  }

  if (team.strategyMatch.state === 'IN PROGRESS') {
    if(typeof team.strategyMatch.endAt === 'string')
      team.strategyMatch.endAt = new Date(team.strategyMatch.endAt);
    if (team.strategyMatch.endAt.getTime() < now.getTime())
      return { isStale: true, gameState: 'strategyMatch' };
  }

  return { isStale: false };
}

function inferenceGameType(gameName: string) {
  let key: keyof typeof relayNames | keyof typeof strategyNames;
  for (key in relayNames) {
    if (relayNames[key] === gameName)
      return 'relayMatch'
  }
  for (key in strategyNames) {
    if (strategyNames[key] === gameName)
      return 'strategyMatch'
  }
  throw new Error(`Unregistered gamename: ${gameName} `);
}

export async function closeMatch(matchId: string, teams: TeamsRepository, db: StorageAPI.Async | StorageAPI.Sync) {
  console.log("HERE");
  const currentMatch = await db.fetch(matchId, { state: true, metadata: true });
  const teamId = currentMatch.metadata.players[0].name;
  //TODO: FIX THIS
  console.log("teamId", teamId);
  console.log(JSON.stringify(currentMatch.metadata.players))
  if(!teamId)
    throw new Error(`Match teamId is not valid, the match has the following players:${currentMatch.metadata.players}`);
  const team: TeamModel | null = await teams.getTeam({ teamId }) ?? null;
  if (team == null)
    throw new Error(`Match team is not found, the match has the following players:${currentMatch.metadata.players}`);

  const type = inferenceGameType(currentMatch.metadata.gameName);
  console.log("TYPE", type);
  if (team[type].state !== "IN PROGRESS")
    throw new Error(`The match{${matchId}} is not in progress, you can't close it`)
  const mStat = team[type] as InProgressMatchStatus;
  const finishState = await endMatchStatus(mStat, currentMatch.state.G.points);
  console.log("finishState", finishState)
  await team.update({ [type]: finishState });
}

export async function getNewGame(ctx: Server.AppCtx, teams: TeamsRepository, games: Game<any, Record<string, unknown>, any>[], gameType: 'RELAY' | 'STRATEGY') {
  const GUID = ctx.params.GUID;
  const team: TeamModel = await teams.getTeam({ teamId: GUID }) ?? ctx.throw(404, `Team with {id:${GUID}} not found.`)
  
  //if middelware setup was better understand, this should be in a separated midleware
  const staleInfo =  await checkStaleMatch(team);
  if(staleInfo.isStale){
    closeMatch((team[staleInfo.gameState!] as InProgressMatchStatus).matchID,teams,ctx.db);
  }
  
  if (! await allowedToStart(team, gameType)){
    ctx.throw(403, "Team is not allowed to start game.")
  }
  
  //find gameName based on team category
  console.log(team.category)
  const gameName = (gameType === 'RELAY') ?
    relayNames[team.category as keyof typeof relayNames] : strategyNames[team.category as keyof typeof strategyNames]

  const game: Game<any, Record<string, unknown>> = games.find((g) => g.name === gameName) ?? ctx.throw(404, 'Game ' + gameName + ' not found');

  return { game, team }
}