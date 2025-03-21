import { LOCAL_STORAGE_TEAMSTATE } from "../client/api-repository-interface";
import { TeamModelDto } from "../client/dto/TeamStateDto";
import { isOnlineMode } from "../client/utils/appMode";

function sendData(fileName: string, data: string){
  if (isOnlineMode()){
    return;
  }
  const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;
  const folder = process.env.REACT_APP_S3_FOLDER;
  if (bucketName === undefined || folder === undefined) {
    throw new Error('S3 bucket name or folder is not defined.');
  }
  const fd = new FormData();
  fd.append('key', folder + '/' + fileName);
  fd.append('file', data);
  // utf8 charset
  fd.append('Content-Type', 'text/plain; charset=utf-8');
  fetch(
    bucketName,
    { method: 'POST', body: fd, mode: 'cors'}).then(res => console.log(res.status)
  );
}

const randomID = Math.floor(Math.random() * 900000)+100000;

function now(){
  const date = new Date()
  // Removing ":", because Windows can not process it if the file name contains it.
  const result = date.toISOString().replace(/[^A-Za-z0-9]+/g,'').slice(0, -1)
  return result;
}

function getJoinCode(teamState: TeamModelDto | null){
  if (teamState !== null) {
    return teamState.joinCode;
  }
  const teamstateString = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
  if (teamstateString === null) {
    throw new Error('Váratlan hiba történt (toHome)');
  }
  const teamStateStorage = JSON.parse(teamstateString);
  return teamStateStorage.joinCode;
}

export function sendDataLogin(teamState: TeamModelDto | null){
  let code = getJoinCode(teamState);
  sendData(code+"_"+randomID+"_login_"+now(), "code");
}


export function sendDataRelayStart(teamState: TeamModelDto | null){
  let code = getJoinCode(teamState);
  sendData(code+"_"+randomID+"_relaystart_"+now(), "");
}

export function sendDataRelayStep(teamState: TeamModelDto | null, G: any, ctx: any, answer: number){
  let code = getJoinCode(teamState);
  let problemNumber = G.currentProblem;
  sendData(code+"_"+randomID+"_relay_"+problemNumber+"_"+answer+"_"+now(), JSON.stringify({G, ctx}));
}

export function sendDataRelayEnd(teamState: TeamModelDto | null, G: any, ctx: any){
  console.log("asd2")
  let code = getJoinCode(teamState);
  let points = G.points;
  sendData(code+"_"+randomID+"_relayend_"+points+"_"+now(), JSON.stringify({G, ctx}));
}

export function sendDataStrategyStart(teamState: TeamModelDto | null){
  let code = getJoinCode(teamState);
  sendData(code+"_"+randomID+"_stratstart_"+now(), "");
}

export function sendDataStrategyStep(teamState: TeamModelDto | null, pile:number,  G: any, ctx: any){
  let code = getJoinCode(teamState);
  sendData(code+"_"+randomID+"_strat_"+pile+"_"+now(), JSON.stringify({G, ctx}));
}

export function sendDataStrategyEnd(teamState: TeamModelDto | null, G: any, ctx: any){
  let code = getJoinCode(teamState);
  let points = G.points;
  sendData(code+"_"+randomID+"_stratend_"+points+"_"+now(), JSON.stringify({G, ctx}));
}