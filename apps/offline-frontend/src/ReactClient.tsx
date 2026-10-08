import { GameRelay, MyGameWrappers, strategyNames } from "game";
import { StrategyWrappers } from "game/bot";
import { descriptionC, descriptionD, descriptionE, MyBoardWrapper } from "game/client";
import { RelayStrategy } from "relay-bot";
import { InProgressRelay, type CompetitionCategory } from "common-frontend";
import { ClientFactory, ClientFactoryRelay } from "./client_factory";

const GameC = MyGameWrappers.C();
const GameD = MyGameWrappers.D();
const GameE = MyGameWrappers.E();

const description = <p className="text-justify"></p>
export const { ClientWithBot: RelayClientWithBotC } = ClientFactoryRelay({ ...GameRelay, name: "relay_c" }, InProgressRelay, RelayStrategy("C"), description);
export const { ClientWithBot: RelayClientWithBotD } = ClientFactoryRelay({ ...GameRelay, name: "relay_d" }, InProgressRelay, RelayStrategy("D"), description);
export const { ClientWithBot: RelayClientWithBotE } = ClientFactoryRelay({ ...GameRelay, name: "relay_e" }, InProgressRelay, RelayStrategy("E"), description);
export const { ClientWithBot: StrategyClientWithBotC } = ClientFactory({ ...GameC, name: strategyNames.C }, MyBoardWrapper("C"), StrategyWrappers.C(), descriptionC);
export const { ClientWithBot: StrategyClientWithBotD } = ClientFactory({ ...GameD, name: strategyNames.D }, MyBoardWrapper("D"), StrategyWrappers.D(), descriptionD);
export const { ClientWithBot: StrategyClientWithBotE } = ClientFactory({ ...GameE, name: strategyNames.E }, MyBoardWrapper("E"), StrategyWrappers.E(), descriptionE);


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
