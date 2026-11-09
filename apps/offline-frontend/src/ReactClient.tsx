import { MyGameWrappers, strategyGameOfCategory, strategyNames } from "game";
import { StrategyWrappers } from "game/bot";
import { MyBoardWrapper, strategyDescriptions } from "game/client";
import { relayStrategy } from "relay-bot";
import { dryRunRelay } from "./dry-run-relays";
import { InProgressRelay, type CompetitionCategory } from "common-frontend";
import { ClientFactory, ClientFactoryRelay } from "./client_factory";

const { C: gameC, D: gameD, E: gameE } = strategyGameOfCategory;
const GameC = MyGameWrappers[gameC]();
const GameD = MyGameWrappers[gameD]();
const GameE = MyGameWrappers[gameE]();

const description = <p className="text-justify"></p>
export const { ClientWithBot: RelayClientWithBotC } = ClientFactoryRelay("relay_c", InProgressRelay, relayStrategy(dryRunRelay("C")), description);
export const { ClientWithBot: RelayClientWithBotD } = ClientFactoryRelay("relay_d", InProgressRelay, relayStrategy(dryRunRelay("D")), description);
export const { ClientWithBot: RelayClientWithBotE } = ClientFactoryRelay("relay_e", InProgressRelay, relayStrategy(dryRunRelay("E")), description);
export const { ClientWithBot: StrategyClientWithBotC } = ClientFactory({ ...GameC, name: strategyNames[gameC] }, MyBoardWrapper(gameC), StrategyWrappers[gameC](), strategyDescriptions[gameC]);
export const { ClientWithBot: StrategyClientWithBotD } = ClientFactory({ ...GameD, name: strategyNames[gameD] }, MyBoardWrapper(gameD), StrategyWrappers[gameD](), strategyDescriptions[gameD]);
export const { ClientWithBot: StrategyClientWithBotE } = ClientFactory({ ...GameE, name: strategyNames[gameE] }, MyBoardWrapper(gameE), StrategyWrappers[gameE](), strategyDescriptions[gameE]);


// Only the competition's categories reach here: they are all `teamData.ts` holds.
const RELAY_CLIENTS: Record<CompetitionCategory, typeof RelayClientWithBotC> = {
  C: RelayClientWithBotC,
  D: RelayClientWithBotD,
  E: RelayClientWithBotE,
};
const STRATEGY_CLIENTS: Record<CompetitionCategory, typeof StrategyClientWithBotC> = {
  C: StrategyClientWithBotC,
  D: StrategyClientWithBotD,
  E: StrategyClientWithBotE,
};

export function RelayClient({ category }: {
  category: CompetitionCategory,
}) {
  const Client = RELAY_CLIENTS[category];
  return <Client />;
}

export function StrategyClient({ category }: {
  category: CompetitionCategory,
}) {
  const Client = STRATEGY_CLIENTS[category];
  return <Client />;
}
