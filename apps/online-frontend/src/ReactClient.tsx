import { GameRelay, MyGameWrappers } from "game";
import type { StrategyGameKey } from "game";
import { MyBoardWrapper, strategyDescriptions } from "game/client";
import { ClientFactory, ClientFactoryRelay, InProgressRelay } from "common-frontend";
import { relayGameName, strategyGameName } from "schemas";
import type { PublicCompetition } from "schemas";
import { useTranslation } from "react-i18next";

const description = <p className="text-justify"></p>

type OnlineClient = ReturnType<typeof ClientFactoryRelay>["OnlineClient"];

// One client per competition and match, built the first time a team of it
// opens the match and kept, so a re-render does not remount the board. Each is
// registered under the name the server hosts it by (games.ts in the backend);
// the match's state, its clock included, is the server's, so the client's
// copy of the game needs no duration.
// No server URL: the socket connects to the page's own origin, in dev through
// the Vite proxy (vite.config.ts), in the stack through nginx.
const relayClients = new Map<string, OnlineClient>();
const strategyClients = new Map<string, OnlineClient>();

function relayClient(competition: PublicCompetition): OnlineClient | null {
  if (competition.relay === undefined) return null;
  let client = relayClients.get(competition.id);
  if (client === undefined) {
    const game = { ...GameRelay, name: relayGameName(competition.id) };
    client = ClientFactoryRelay(game, InProgressRelay, description).OnlineClient;
    relayClients.set(competition.id, client);
  }
  return client;
}

function strategyClient(competition: PublicCompetition): OnlineClient | null {
  const { strategy } = competition;
  if (strategy === undefined) return null;
  let client = strategyClients.get(competition.id);
  if (client === undefined) {
    const gameId = strategy.gameId as StrategyGameKey;
    const game = { ...MyGameWrappers[gameId](), name: strategyGameName(competition.id) };
    client = ClientFactory(game, MyBoardWrapper(gameId), strategyDescriptions[gameId]).OnlineClient;
    strategyClients.set(competition.id, client);
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
  return <p>{t('relay.error.badCategory')}</p>;
}

export function RelayClient({ competition, matchID, credentials }: ClientProps) {
  const Client = competition ? relayClient(competition) : null;
  return Client ? <Client {...{ credentials, matchID }}/> : <NoMatch/>;
}

export function StrategyClient({ competition, matchID, credentials }: ClientProps) {
  const Client = competition ? strategyClient(competition) : null;
  return Client ? <Client {...{ credentials, matchID }}/> : <NoMatch/>;
}
