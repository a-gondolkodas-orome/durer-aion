import { lazy } from "react";
import type { ComponentType } from "react";
import { GameRelay } from "game";
import type { GameType } from "game";
import { ClientFactory, ClientFactoryRelay, InProgressRelay } from "common-frontend";
import type { StrategyBoard, StrategyDescription } from "common-frontend";
import { strategyGameName } from "schemas";
import type { PublicCompetition } from "schemas";
import { useTranslation } from "react-i18next";

const description = <p className="text-justify"></p>

type OnlineClient = ReturnType<typeof ClientFactoryRelay>;

// One client per game, built the first time a team opens a match of it and
// kept, so a re-render does not remount the board. Each is registered under
// the name the server hosts it by (games.ts in the backend); the match's
// state, its clock included, is the server's, so the client's copy of the
// game needs no duration.
// No server URL: the socket connects to the page's own origin, in dev through
// the Vite proxy (vite.config.ts), in the stack through nginx.
let relayOnlineClient: OnlineClient | undefined;

function relayClient(competition: PublicCompetition): OnlineClient | null {
  if (competition.relay === undefined) return null;
  relayOnlineClient ??= ClientFactoryRelay(GameRelay, InProgressRelay, description);
  return relayOnlineClient;
}

/// A game folder's client.tsx, as the gate serves it built.
interface StrategyClientModule {
  strategyClient: (gameId: string) => {
    game: GameType<unknown>;
    board: StrategyBoard<unknown>;
    description: StrategyDescription;
  };
}

// The strategy game is not in this build: the backend's gate serves the team's
// own (#643). One module per match, so the next team on the tab gets its own
// game; at module scope, so the lazy component keeps its identity (App.tsx).
const strategyClients = new Map<string, ComponentType<ClientRenderProps>>();

function strategyClient(matchID: string, gameId: string): ComponentType<ClientRenderProps> {
  let client = strategyClients.get(matchID);
  if (client === undefined) {
    client = lazy(async () => {
      const url = `/team/me/strategy-client.js?match=${encodeURIComponent(matchID)}`;
      const loaded = await import(/* @vite-ignore */ url) as StrategyClientModule;
      const { game, board, description } = loaded.strategyClient(gameId);
      return { default: ClientFactory({ ...game, name: strategyGameName(gameId) }, board, description) };
    });
    strategyClients.set(matchID, client);
  }
  return client;
}

interface ClientRenderProps {
  matchID?: string,
  credentials?: string,
}

interface ClientProps extends ClientRenderProps {
  competition?: PublicCompetition | null,
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
  const gameId = competition?.strategy?.gameId;
  const Client = gameId && matchID ? strategyClient(matchID, gameId) : null;
  return Client ? <Client {...{ credentials, matchID }}/> : <NoMatch/>;
}
