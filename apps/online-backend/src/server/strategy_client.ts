import type { StorageAPI } from "boardgame.io";
import { strategyGameFolders } from "game/strategy";
import { strategyGameIdOf } from "schemas";
import type { MatchStatus } from "schemas";

/** nginx's internal location for the built game clients (nginx.conf). */
export const GATED_STRATEGY_PATH = "/gated/strategy/";

/** The game folder of the team's strategy match, null before it starts. Read
 *  from the match, not the competition, which an organiser may change after
 *  the start. */
export async function startedStrategyFolder(db: StorageAPI.Async | StorageAPI.Sync, strategyMatch: MatchStatus): Promise<string | null> {
  if (strategyMatch.state === "NOT STARTED") return null;
  const { metadata } = await db.fetch(strategyMatch.matchID, { metadata: true });
  const gameId = strategyGameIdOf(metadata?.gameName ?? "");
  if (gameId === undefined || !Object.prototype.hasOwnProperty.call(strategyGameFolders, gameId)) {
    throw new Error(`Strategy match ${strategyMatch.matchID} is of a game no folder plays.`);
  }
  return strategyGameFolders[gameId as keyof typeof strategyGameFolders];
}
