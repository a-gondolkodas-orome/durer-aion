import type { StorageAPI } from "boardgame.io";
import { strategyGameClients } from "game/strategy";
import type { StrategyGameKey } from "game/strategy";
import { strategyGameIdOf } from "schemas";
import type { MatchStatus, StartedStrategyGame } from "schemas";

/** nginx's internal location for the built game clients (nginx.conf). */
export const GATED_STRATEGY_PATH = "/gated/strategy/";

export interface StrategyGameClient extends StartedStrategyGame {
  gameId: StrategyGameKey;
  folder: string;
}

type Storage = StorageAPI.Async | StorageAPI.Sync;

export class UnknownStrategyGameError extends Error {}

/** The game of the team's strategy match, null before it starts. Read from
 *  the match, not the competition, which an organiser may change after the
 *  start. */
export async function startedStrategyGame(db: Storage, strategyMatch: MatchStatus): Promise<StrategyGameClient | null> {
  if (strategyMatch.state === "NOT STARTED") return null;
  const { metadata } = await db.fetch(strategyMatch.matchID, { metadata: true });
  const gameId = strategyGameIdOf(metadata?.gameName ?? "");
  if (gameId === undefined || !Object.prototype.hasOwnProperty.call(strategyGameClients, gameId)) {
    throw new UnknownStrategyGameError(`Strategy match ${strategyMatch.matchID} is of a game no folder plays.`);
  }
  const key = gameId as StrategyGameKey;
  return { gameId: key, ...strategyGameClients[key] };
}

/** The started game as the team is told it, without the folder. An unknown
 *  game reads as none, so the rest of the team's page still loads. */
export async function publicStrategyGame(db: Storage, strategyMatch: MatchStatus): Promise<StartedStrategyGame | null> {
  try {
    const game = await startedStrategyGame(db, strategyMatch);
    if (game === null) return null;
    const { gameId, variant } = game;
    return variant === undefined ? { gameId } : { gameId, variant };
  } catch (error) {
    if (error instanceof UnknownStrategyGameError) return null;
    throw error;
  }
}
