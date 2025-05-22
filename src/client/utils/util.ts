import { GUESSER_PLAYER, JUDGE_PLAYER, PlayerIDType } from "../../common/types";

export const IS_COMPETETIVE_MODE = process.env.REACT_APP_WHICH_VERSION !== "c"
export const IS_OFFLINE_MODE = process.env.REACT_APP_WHICH_VERSION === "b" || !IS_COMPETETIVE_MODE

export function otherPlayer(playerID: PlayerIDType): PlayerIDType {
  return playerID === GUESSER_PLAYER ? JUDGE_PLAYER : GUESSER_PLAYER;
}
