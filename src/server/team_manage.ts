import { Server } from "boardgame.io";
import { FinishedMatchStatus, InProgressMatchStatus, TeamModel } from "./entities/model";


export async function startMatchStatus(matchId:string,ctx:Server.AppCtx):Promise<InProgressMatchStatus>{
  const currentMatch = await ctx.db.fetch(matchId,{state:true});
  return{
    state: 'IN PROGRESS',
    matchID:matchId,
    startAt:currentMatch.state.G.startAt,
    endAt:currentMatch.state.G.endAt,
  }
}

export async function endMatchStatus(matchId:string,ctx:Server.AppCtx):Promise<FinishedMatchStatus>{
  const currentMatch = await ctx.db.fetch(matchId,{state:true});
  return{
    state: 'FINISHED',
    matchID:matchId,
    startAt:currentMatch.state.G.startAt,
    endAt:currentMatch.state.G.endAt,
    score:currentMatch.state.G.score,
  }
}

export async function allowedToStart(team:TeamModel, ctx:Server.AppCtx) {
  //TODO ha nagyon 
  console.warn("Unimplemented fucntion called.")
}

export async function isAlreadyStale(team:TeamModel,matchID:string,ctx:Server.AppCtx){
  // Find if boardgame match is already timed out, but not registered
  //TODO ha nagyon akarom
  console.warn("Unimplemented fucntion called.")
}