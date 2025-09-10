import { LOCAL_STORAGE_TEAMSTATE, TeamModelDto } from "common-frontend";


function sendData(fileName: string, data: string){
  const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;
  const folder = import.meta.env.VITE_S3_FOLDER;
  if (!bucketName || !folder) {
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

function getJoinCode(teamState?: TeamModelDto | null){
  if (teamState !== undefined && teamState !== null) {
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

export function sendGameData(component: "relay" | "strategy", phase: "start" | "step" | "end", answer?: number, G?: any, ctx?: any, log?: any) {
  const joinCode = getJoinCode(null);
  switch (phase) {
    case "start":
      sendData(joinCode+"_"+randomID+"_"+component+"start_"+now(), "");
      break;
    case "step":
      switch (component) {
        case "relay":
          let problemNumber = G.currentProblem;
          sendData(joinCode+"_"+randomID+"_"+component+"_"+problemNumber+"_"+answer+"_"+now(), JSON.stringify({G, ctx}));
          break;
        case "strategy":
          sendData(joinCode+"_"+randomID+"_stratstep_"+now(), JSON.stringify({G, ctx, log}));
          break;
        default:
          break;
      }
      break;
    case "end":
      let points = G.points;
      sendData(joinCode+"_"+randomID+"_"+component+"end_"+points+"_"+now(), JSON.stringify({G, ctx}));
      break;
    default:
      break;
  }
}
