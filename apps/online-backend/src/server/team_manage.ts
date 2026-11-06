import { createMatch } from "boardgame.io/internal";
import { nanoid } from "nanoid";
import { getBotCredentials, relayNames } from "./common";
import { AnyBgioGame, PlayerIDType, strategyNames } from "game";
import { LobbyAPI, Server, StorageAPI } from "boardgame.io";
import { CompetitionCategory, GameType } from "schemas";
import { BOT_ID, fetch } from "../socketio_botmoves";
import { TeamModel } from "./model";
import { teamMatches, type TeamMatches } from "./match_status";

/** Joins a player to a match where the bot's side is not connected.
 * @param db: Database context
 * @param matchID: match id to connect a bot to
 *
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
export const injectPlayer = async (
  db: StorageAPI.Async | StorageAPI.Sync,
  matchId: string,
  {
  playerID,
  name,
    credentials,
}: {
    playerID: PlayerIDType;
    name: string;
    credentials: string;
}
) => {
  const match = await fetch(db, matchId, { metadata: true });
  match.metadata.players[playerID].name = name;
  match.metadata.players[playerID].credentials = credentials;
  match.metadata.players[playerID].isConnected = true;
  await db.setMetadata(matchId, match.metadata);
};

/** Joins a bot to a match where the bot's side is not connected.
 * @param db: Database context
 * @param matchID: match id to connect a bot to
 *
 * This should be in line with boardgame.io/src/server/api.ts
 * path would be '/games/:name/:id/join'.
 */
export const injectBot = async (
  db: StorageAPI.Async | StorageAPI.Sync,
  matchId: string
) => {
  await injectPlayer(db, matchId, {
    playerID: BOT_ID,
    name: "Bot",
    credentials: getBotCredentials(),
  });
};

/**
 * Creates a game based on context, and given Game.
 * This is the interface between the API, and BGio components.
 *
 * @param {AnyBgioGame} game - Game object
 * @param {Server.AppCtx} ctx - Context of the Koa & BGio call
 * @returns {LobbyAPI.CreatedMatch} - MatchID for the created game
 */
export async function createGame(
  game: AnyBgioGame,
  ctx: Server.AppCtx
) {
  const matchID: string = nanoid(11);
  const match = createMatch({
    game,
    numPlayers: 2,
    setupData: undefined,
    // Kept out of boardgame.io's lobby listing as well as behind the closed
    // `/games` prefix (server/router.ts): the listing carries the metadata,
    // and the team's GUID, which the session cookie carries
    // (server/team_session.ts), is that metadata's player name.
    unlisted: true,
  });

  if ("setupDataError" in match) {
    ctx.throw(400, match.setupDataError);
  } else {
    await ctx.db.createMatch(matchID, match);
  }

  const body: LobbyAPI.CreatedMatch = { matchID };
  return body;
}

/** Whether the team may start a match of `gameType`: one attempt at each
 *  match, never both at once, and only after the disclaimer. */
export function allowedToStart(
  team: Pick<TeamModel, "pageState">,
  matches: TeamMatches,
  gameType: GameType
) {
  if (team.pageState === "DISCLAIMER")
    return false;
  if (team.pageState === gameType)
    return false;
  if (
    matches.relayMatch.state === "IN PROGRESS" ||
    matches.strategyMatch.state === "IN PROGRESS"
  )
    return false;
  const own = gameType === "RELAY" ? matches.relayMatch : matches.strategyMatch;
  return own.state === "NOT STARTED";
}

const gameNames: Record<GameType, Record<CompetitionCategory, string>> = {
  RELAY: relayNames,
  STRATEGY: strategyNames,
};

export async function getNewGame(
  ctx: Server.AppCtx,
  games: AnyBgioGame[],
  gameType: GameType,
  team: TeamModel
) {
  if (!allowedToStart(team, await teamMatches(ctx.db, team), gameType)) {
    ctx.throw(403, "Team is not allowed to start game.");
  }
  // The import admits only the competition's categories.
  const gameName = gameNames[gameType][team.category as CompetitionCategory];

  const game: AnyBgioGame = games.find(
    (g) => g.name === gameName
  ) ?? ctx.throw(404, "Game " + gameName + " not found");

  return { game, team };
}
