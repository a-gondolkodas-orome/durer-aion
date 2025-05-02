import { PlayerIDType } from "../../common/types";

export const IS_OFFLINE_MODE = process.env.REACT_APP_WHICH_VERSION === "b"

export function otherPlayer(playerID: PlayerIDType): PlayerIDType {
  return playerID === PlayerIDType.GUESSER_PLAYER ? PlayerIDType.JUDGE_PLAYER : PlayerIDType.GUESSER_PLAYER;
}

export function parseGameState<T_SpecificGameState>(json: string): T_SpecificGameState {
  const parsed = JSON.parse(json);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('strategy: game_state_from_json: Invalid JSON: not an object');
  }
  return parsed as T_SpecificGameState;
}

export function saveGameState(G: any, ctx: any, gameName: string) {
  if (!IS_OFFLINE_MODE) {
    return;
  }
  localStorage.setItem(gameName + "GameState", JSON.stringify(G));
  localStorage.setItem(gameName + "Phase", ctx.phase);
}
