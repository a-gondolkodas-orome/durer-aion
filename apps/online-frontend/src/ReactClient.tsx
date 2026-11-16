import { GameRelay, MyGameWrappers } from "game";
import type { StrategyGameKey } from "game";
import { MyBoardWrapper, strategyDescriptions } from "game/client";
import { ClientFactory, ClientFactoryRelay, InProgressRelay } from "common-frontend";
import { RELAY_GAME_NAME, strategyGameName } from "schemas";
import type { PublicCompetition } from "schemas";
import { useTranslation } from "react-i18next";

const description = <p className="text-justify"></p>

type OnlineClient = ReturnType<typeof ClientFactoryRelay>["OnlineClient"];

// One client per game, built the first time a team opens a match of it and
// kept, so a re-render does not remount the board. Each is registered under
// the name the server hosts it by (games.ts in the backend); the match's
// state, its clock included, is the server's, so the client's copy of the
// game needs no duration.
// No server URL: the socket connects to the page's own origin, in dev through
// the Vite proxy (vite.config.ts), in the stack through nginx.
let relayOnlineClient: OnlineClient | undefined;
const strategyClients = new Map<StrategyGameKey, OnlineClient>();

function relayClient(competition: PublicCompetition): OnlineClient | null {
  if (competition.relay === undefined) return null;
  relayOnlineClient ??= ClientFactoryRelay({ ...GameRelay, name: RELAY_GAME_NAME }, InProgressRelay, description).OnlineClient;
  return relayOnlineClient;
}

function strategyClient(competition: PublicCompetition): OnlineClient | null {
  const { strategy } = competition;
  if (strategy === undefined) return null;
  const gameId = strategy.gameId as StrategyGameKey;
  let client = strategyClients.get(gameId);
  if (client === undefined) {
    const game = { ...MyGameWrappers[gameId](), name: strategyGameName(gameId) };
    client = ClientFactory(game, MyBoardWrapper(gameId), strategyDescriptions[gameId]).OnlineClient;
    strategyClients.set(gameId, client);
  }
  return client;
}

interface ClientProps {
  competition?: PublicCompetition | null,
  matchID?: string,
  credentials?: string,
}

// The team's competition decides the board; one without the match (which the
// chooser does not offer) or a team without a competition has none.
function NoMatch() {
  const { t } = useTranslation();
  return <p>{t('relay.error.noMatch')}</p>;
}

export function RelayClient({ competition, matchID, credentials }: ClientProps) {
  const Client = competition ? relayClient(competition) : null;
  return Client ? <Client {...{ credentials, matchID }}/> : <NoMatch/>;
}

export function StrategyClient({ competition, matchID, credentials }: ClientProps) {
  const Client = competition ? strategyClient(competition) : null;
  return Client ? <Client {...{ credentials, matchID }}/> : <NoMatch/>;
}
