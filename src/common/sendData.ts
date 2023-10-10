import { TeamModelDto } from "../client/dto/TeamStateDto";

function sendData(fileName: string, data: string){
  if (process.env.REACT_APP_WHICH_VERSION !== "b"){
    return;
  }
  const fd = new FormData();
  fd.append('key', "titok/"+fileName);
  fd.append('file', data);
  // utf8 charset
  fd.append('Content-Type', 'text/plain; charset=utf-8');
  fetch('https://adamprobalkozik.s3.eu-central-1.amazonaws.com', { method: 'POST', body: fd, mode: 'cors'}).then(res => console.log(res.status));
}

const randomID = Math.floor(Math.random() * 900000)+100000;

function now(){
  const date = new Date()
  const result = date.toISOString().replace(/[^A-Za-z0-9]+/g,'').slice(0, -1)
  return result;
}

export function sendDataLogin(teamState: TeamModelDto | null){
  let code = "null";
  if (teamState !== null) {
    code = teamState.joinCode;
  }
  sendData(code+"_"+randomID+"_login_"+now(), "code");
}


export function sendDataRelayStart(teamState: TeamModelDto | null){
  let code = "null";
  if (teamState !== null) {
    code = teamState.joinCode;
  }
  sendData(code+"_"+randomID+"_relaystart_"+now(), "");
}

export function sendDataRelayStep(teamState: TeamModelDto | null, G: any, ctx: any, answer: number){
  let code = "null";
  if (teamState !== null) {
    code = teamState.joinCode;
  }
  let problemNumber = G.currentProblem;
  sendData(code+"_"+randomID+"_relay_"+problemNumber+"_"+answer+"_"+now(), JSON.stringify({G, ctx}));
}

export function sendDataRelayEnd(teamState: TeamModelDto | null, G: any, ctx: any){
  let code = "null";
  if (teamState !== null) {
    code = teamState.joinCode;
  }
  let points = G.points;
  sendData(code+"_"+randomID+"_relayend_"+points+"_"+now(), JSON.stringify({G, ctx}));
}

export function sendDataStrategyStart(teamState: TeamModelDto | null){
  let code = "null";
  if (teamState !== null) {
    code = teamState.joinCode;
  }
  sendData(code+"_"+randomID+"_stratstart_"+now(), "");
}

export function sendDataStrategyStep(teamState: TeamModelDto | null, K:number, L:number,  G: any, ctx: any){
  let code = "null";
  if (teamState !== null) {
    code = teamState.joinCode;
  }
  sendData(code+"_"+randomID+"_strat_"+K+L+"_"+now(), JSON.stringify({G, ctx}));
}

export function sendDataStrategyEnd(teamState: TeamModelDto | null, G: any, ctx: any){
  let code = "null";
  if (teamState !== null) {
    code = teamState.joinCode;
  }
  let points = G.points;
  sendData(code+"_"+randomID+"_stratend_"+points+"_"+now(), JSON.stringify({G, ctx}));
}