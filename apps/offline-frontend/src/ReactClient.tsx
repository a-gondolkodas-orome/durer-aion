import { GameRelay, descriptionC, descriptionD, descriptionE, MyBoardWrapper, MyGameWrappers, RelayStrategy, StrategyWrappers, strategyNames} from "game";
import { InProgressRelay } from "common-frontend";
import { ClientFactory, ClientFactoryRelay } from "./client_factory";

const GameC = MyGameWrappers.C();
const GameD = MyGameWrappers.D();
const GameE = MyGameWrappers.E();

let description = <p className="text-justify"></p>
export const { ClientWithBot: RelayClientWithBotC } = ClientFactoryRelay({...GameRelay, name: "relay_c"}, InProgressRelay, RelayStrategy("C"), description);
export const { ClientWithBot: RelayClientWithBotD } = ClientFactoryRelay({...GameRelay, name: "relay_d"}, InProgressRelay, RelayStrategy("D"), description);
export const { ClientWithBot: RelayClientWithBotE } = ClientFactoryRelay({...GameRelay, name: "relay_e"}, InProgressRelay, RelayStrategy("E"), description);
export const { ClientWithBot: StrategyClientWithBotC } = ClientFactory({...GameC, name: strategyNames.C}, MyBoardWrapper("C"), StrategyWrappers.C(), descriptionC);
export const { ClientWithBot: StrategyClientWithBotD } = ClientFactory({...GameD, name: strategyNames.D}, MyBoardWrapper("D"), StrategyWrappers.D(), descriptionD);
export const { ClientWithBot: StrategyClientWithBotE } = ClientFactory({...GameE, name: strategyNames.E}, MyBoardWrapper("E"), StrategyWrappers.E(), descriptionE);


export function RelayClient({ category }: {
  category?: undefined | 'C' | 'D' | 'E',
}) {
  return (
    <>
      {category === 'C' && (
        <RelayClientWithBotC />
      )}
      {category === 'D' && (
          <RelayClientWithBotD />
      )}
      {category === 'E' && (
          <RelayClientWithBotE />
      )}
    </>
  );
}

export function StrategyClient({ category }: {
  category?: undefined | 'C' | 'D' | 'E',
}) {
  return (
    <>
      {category === 'C' && (
          <StrategyClientWithBotC />
      )}
      {category === 'D' && (
          <StrategyClientWithBotD />
      )}
      {category === 'E' && (
          <StrategyClientWithBotE />
      )}
    </>
  );
}
