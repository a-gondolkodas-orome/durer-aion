import type { Ctx } from "boardgame.io";
import { TeamModelDto } from "common-frontend";
import { readStoredTeamState } from "./stored-team-state";


// Same reasoning as apps/offline-frontend/src/sendData.ts: `sendGameData` runs from
// `startRelay` and from the game reducers, so throwing here breaks the round itself.
// The /valto/ deploy configures no bucket at all, so an unconfigured build drops the
// data and carries on. Unlike there, no build of this app sets the vars, so an
// unset bucket is the expected configuration rather than something to report:
// warning about it would only tell every practising team that nothing is wrong.
function sendData(fileName: string, data: string) {
  const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;
  const folder = import.meta.env.VITE_S3_FOLDER;
  if (!bucketName || !folder) {
    return;
  }
  const fd = new FormData();
  fd.append('key', folder + '/' + fileName);
  fd.append('file', data);
  // utf8 charset
  fd.append('Content-Type', 'text/plain; charset=utf-8');
  fetch(
    bucketName,
    { method: 'POST', body: fd, mode: 'cors' }
  ).catch((e: unknown) => console.warn('play data upload failed', e));
}

const randomID = Math.floor(Math.random() * 900000) + 100000;

function now() {
  const date = new Date()
  // Removing ":", because Windows can not process it if the file name contains it.
  const result = date.toISOString().replace(/[^A-Za-z0-9]+/g, '').slice(0, -1)
  return result;
}

function getJoinCode(teamState?: TeamModelDto) {
  if (teamState !== undefined) {
    return teamState.joinCode;
  }
  const teamStateStorage = readStoredTeamState();
  if (teamStateStorage === null) {
    throw new Error('Váratlan hiba történt (toHome)');
  }
  return teamStateStorage.joinCode;
}

export function sendDataLogin(teamState: TeamModelDto) {
  const code = getJoinCode(teamState);
  sendData(code + "_" + randomID + "_login_" + now(), "code");
}

export interface SendGameDataParams {
  component: "relay" | "strategy";
  phase: "start" | "step" | "end";
  answer?: number | null;
  // Only these two fields are read here (relay's problem counter and the
  // wrapper's score); the rest of G rides along in the JSON payload.
  G?: { currentProblem?: number; points?: number };
  ctx?: Ctx;
}

export function sendGameData(params: SendGameDataParams) {
  const { component, phase, answer, G, ctx } = params;
  const joinCode = getJoinCode();
  switch (phase) {
    case "start":
      sendData(joinCode + "_" + randomID + "_" + component + "start_" + now(), "");
      break;
    case "step":
      switch (component) {
        case "relay": {
          const problemNumber = G?.currentProblem;
          sendData(joinCode + "_" + randomID + "_" + component + "_" + problemNumber + "_" + answer + "_" + now(), JSON.stringify({ G, ctx }));
          break;
        }
        default:
          break;
      }
      break;
    case "end": {
      const points = G?.points;
      sendData(joinCode + "_" + randomID + "_" + component + "end_" + points + "_" + now(), JSON.stringify({ G, ctx }));
      break;
    }
    default:
      break;
  }
}
