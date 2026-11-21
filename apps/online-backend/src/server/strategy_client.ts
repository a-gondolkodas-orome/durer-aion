import type { StorageAPI } from "boardgame.io";
import { strategyGameClients } from "game/strategy";
import type { StrategyGameKey } from "game/strategy";
import { strategyGameIdOf } from "schemas";
import type { MatchStatus, StartedStrategyGame } from "schemas";

/** Where nginx serves the game folders' built client.tsx files from: an
 *  `internal` location, so only an `X-Accel-Redirect` this server answers
 *  with reaches it (`nginx.conf`, issue #643). */
export const GATED_STRATEGY_PATH = "/gated/strategy/";

/** A started strategy game, with the game folder whose client plays it. */
export interface StrategyGameClient extends StartedStrategyGame {
  gameId: StrategyGameKey;
  folder: string;
}

type Storage = StorageAPI.Async | StorageAPI.Sync;

/** A strategy match whose game no game folder plays: the server is
 *  misconfigured, which is no mistake of the team's. */
export class UnknownStrategyGameError extends Error {}

/**
 * The game of the team's strategy match, read from the match's own metadata:
 * the competition names the game a match *starts* with, and an organiser may
 * change it after a team has started. Null before the match starts.
 *
 * Throws UnknownStrategyGameError for a match whose game no game folder plays.
 */
export async function startedStrategyGame(db: Storage, strategyMatch: MatchStatus): Promise<StrategyGameClient | null> {
  if (strategyMatch.state === "NOT STARTED") return null;
  const { metadata } = await db.fetch(strategyMatch.matchID, { metadata: true });
  const gameName = metadata?.gameName;
  const gameId = gameName === undefined ? undefined : strategyGameIdOf(gameName);
  if (gameId === undefined || !Object.prototype.hasOwnProperty.call(strategyGameClients, gameId)) {
    throw new UnknownStrategyGameError(`Strategy match ${strategyMatch.matchID} is of game ${gameName}, which no game folder plays.`);
  }
  const key = gameId as StrategyGameKey;
  return { gameId: key, ...strategyGameClients[key] };
}

/** What a team is told of its started game: the folder is the server's to
 *  know. A game no folder plays is told as none, so the rest of the team's
 *  page still loads; only the game's own client fails. */
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
