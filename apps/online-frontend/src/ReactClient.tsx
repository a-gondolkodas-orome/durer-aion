import { GameRelay, MyGameWrappers, strategyNames } from "game";
import { descriptionC, descriptionD, descriptionE, MyBoardWrapper } from "game/client";
import { ClientFactory, ClientFactoryRelay, InProgressRelay, type CompetitionCategory } from "common-frontend";

const GameC = MyGameWrappers.C();
const GameD = MyGameWrappers.D();
const GameE = MyGameWrappers.E();

const description = <p className="text-justify"></p>
// No server URL: the socket connects to the page's own origin, in dev through
// the Vite proxy (vite.config.ts), in the stack through nginx.
export const { Client: RelayClient_C, OnlineClient: RelayOnlineClient_C } = ClientFactoryRelay({ ...GameRelay, name: "relay_c" }, InProgressRelay, description);
export const { Client: RelayClient_D, OnlineClient: RelayOnlineClient_D } = ClientFactoryRelay({ ...GameRelay, name: "relay_d" }, InProgressRelay, description);
export const { Client: RelayClient_E, OnlineClient: RelayOnlineClient_E } = ClientFactoryRelay({ ...GameRelay, name: "relay_e" }, InProgressRelay, description);
export const { Client: Client_C, OnlineClient: StrategyOnlineClient_C } = ClientFactory({ ...GameC, name: strategyNames.C }, MyBoardWrapper("C"), descriptionC);
export const { Client: Client_D, OnlineClient: StrategyOnlineClient_D } = ClientFactory({ ...GameD, name: strategyNames.D }, MyBoardWrapper("D"), descriptionD);
export const { Client: Client_E, OnlineClient: StrategyOnlineClient_E } = ClientFactory({ ...GameE, name: strategyNames.E }, MyBoardWrapper("E"), descriptionE);


const RELAY_CLIENTS: Record<CompetitionCategory, typeof RelayOnlineClient_C> = {
  C: RelayOnlineClient_C,
  D: RelayOnlineClient_D,
  E: RelayOnlineClient_E,
};
const STRATEGY_CLIENTS: Record<CompetitionCategory, typeof StrategyOnlineClient_C> = {
  C: StrategyOnlineClient_C,
  D: StrategyOnlineClient_D,
  E: StrategyOnlineClient_E,
};

export function RelayClient({ category, matchID, credentials }: {
  category?: CompetitionCategory, matchID?: string,
  credentials?: string
}) {
  if (category === undefined) return <>unknown category</>;
  const Client = RELAY_CLIENTS[category];
  return <Client {...{ credentials, matchID }}/>;
}

export function StrategyClient({ category, matchID, credentials }: {
  category?: CompetitionCategory, matchID?: string,
  credentials?: string
}) {
  if (category === undefined) return <>unknown category</>;
  const Client = STRATEGY_CLIENTS[category];
  return <Client {...{ credentials, matchID }}/>;
}
