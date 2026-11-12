import { MyGameWrappers, strategyGameOfCategory, strategyNames } from "game";
import { StrategyWrappers } from "game/bot";
import { MyBoardWrapper, strategyDescriptions } from "game/client";
import { relayStrategy } from "relay-bot";
import { dryRunRelay } from "./dry-run-relays";
import { InProgressRelay, type CompetitionCategory } from "common-frontend";
import { perStoredSession } from "common-frontend/core";
import { ClientFactory, ClientFactoryRelay } from "./client_factory";

const description = <p className="text-justify"></p>

function relayClient(category: CompetitionCategory) {
  const gameName = `relay_${category.toLowerCase()}`;
  return ClientFactoryRelay(gameName, InProgressRelay, relayStrategy(dryRunRelay(category)), description).ClientWithBot;
}

function strategyClient(category: CompetitionCategory) {
  const name = strategyGameOfCategory[category];
  const game = MyGameWrappers[name]();
  return ClientFactory({ ...game, name: strategyNames[name] }, MyBoardWrapper(name), StrategyWrappers[name](), strategyDescriptions[name]).ClientWithBot;
}

// Built per stored session, not per page, so the next team logging in on this
// tab starts its own match (perStoredSession says why). Only the competition's
// categories reach here: they are all `teamData.ts` holds.
const relayClientOfSession = perStoredSession(relayClient);
const strategyClientOfSession = perStoredSession(strategyClient);

export function RelayClient({ category }: {
  category: CompetitionCategory,
}) {
  const Client = relayClientOfSession(category);
  return <Client />;
}

export function StrategyClient({ category }: {
  category: CompetitionCategory,
}) {
  const Client = strategyClientOfSession(category);
  return <Client />;
}
