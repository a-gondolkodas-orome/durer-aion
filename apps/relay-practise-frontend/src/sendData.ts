import type { Ctx } from "boardgame.io";
import { LOCAL_STORAGE_TEAMSTATE, TeamModelDto } from "common-frontend";


let warnedAboutMissingBucket = false;

// Same reasoning as apps/offline-frontend/src/sendData.ts: `sendGameData` runs from
// `startRelay` and from the game reducers, so throwing here breaks the round itself.
// The /valto/ deploy configures no bucket at all, so an unconfigured build drops the
// data and carries on.
function sendData(fileName: string, data: string){
  const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;
  const folder = import.meta.env.VITE_S3_FOLDER;
  if (!bucketName || !folder) {
    if (!warnedAboutMissingBucket) {
      warnedAboutMissingBucket = true;
      console.warn(
        'VITE_S3_BUCKET_NAME / VITE_S3_FOLDER are unset: play data is not being uploaded.'
      );
    }
    return;
  }
  const fd = new FormData();
  fd.append('key', folder + '/' + fileName);
  fd.append('file', data);
  // utf8 charset
  fd.append('Content-Type', 'text/plain; charset=utf-8');
  fetch(
    bucketName,
    { method: 'POST', body: fd, mode: 'cors'}).then(res => console.log(res.status)
  ).catch((e: unknown) => console.warn('play data upload failed', e));
}

const randomID = Math.floor(Math.random() * 900000)+100000;

function now(){
  const date = new Date()
  // Removing ":", because Windows can not process it if the file name contains it.
  const result = date.toISOString().replace(/[^A-Za-z0-9]+/g,'').slice(0, -1)
  return result;
}

function getJoinCode(teamState?: TeamModelDto){
  if (teamState !== undefined) {
    return teamState.joinCode;
  }
  const teamstateString = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
  if (teamstateString === null) {
    throw new Error('Váratlan hiba történt (toHome)');
  }
  const teamStateStorage = JSON.parse(teamstateString);
  return teamStateStorage.joinCode;
}

export function sendDataLogin(teamState: TeamModelDto){
  const code = getJoinCode(teamState);
  sendData(code+"_"+randomID+"_login_"+now(), "code");
}

interface SendGameDataParams {
  component: "relay" | "strategy";
  phase: "start" | "step" | "end";
  answer?: number | null;
  // Only these two fields are read here (relay's problem counter and the
  // wrapper's score); the rest of G rides along in the JSON payload.
  G?: { currentProblem?: number; points?: number };
  ctx?: Ctx;
  // Only ever JSON-stringified here, so whatever a caller reports as its log
  // is passed through: gameWrapper's move context carries the log plugin.
  log?: unknown;
}

export function sendGameData(params: SendGameDataParams){
  const {component, phase, answer, G, ctx, log} = params;
  const joinCode = getJoinCode();
  switch (phase) {
    case "start":
      sendData(joinCode+"_"+randomID+"_"+component+"start_"+now(), "");
      break;
    case "step":
      switch (component) {
        case "relay": {
          const problemNumber = G?.currentProblem;
          sendData(joinCode+"_"+randomID+"_"+component+"_"+problemNumber+"_"+answer+"_"+now(), JSON.stringify({G, ctx}));
          break;
        }
        case "strategy":
          sendData(joinCode+"_"+randomID+"_stratstep_"+now(), JSON.stringify({G, ctx, log}));
          break;
        default:
          break;
      }
      break;
    case "end": {
      const points = G?.points;
      sendData(joinCode+"_"+randomID+"_"+component+"end_"+points+"_"+now(), JSON.stringify({G, ctx}));
      break;
    }
    default:
      break;
  }
}
