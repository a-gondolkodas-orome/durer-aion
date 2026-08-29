import { GUESSER_PLAYER, JUDGE_PLAYER, PlayerIDType } from "game";

export function otherPlayer(playerID: PlayerIDType): PlayerIDType {
  return playerID === GUESSER_PLAYER ? JUDGE_PLAYER : GUESSER_PLAYER;
}

export { BGIO_LOCALSTORAGE_PREFIX } from "./storage-keys";
