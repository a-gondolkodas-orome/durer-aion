import { GameRelay, descriptionC, descriptionD, descriptionE, MyBoard, MyGameWrapper, RelayStrategy,strategyWrapper } from "game";
import { InProgressRelay } from "common-frontend";
import { ClientFactory, ClientFactoryRelay } from "./client_factory";
import { RelayProblem } from "game";
import { getS3Url, parseProblemTOML } from "strategy";

const GameCircleC = MyGameWrapper("C");
const GameCircleD = MyGameWrapper("D");
const GameCircleE = MyGameWrapper("E");

function getProblems(category: 'C' | 'D' | 'E'): () => Promise<RelayProblem[]> {
  throw new Error("Not implemented.");
}

let description = <p className="text-justify"></p>
export const { ClientWithBot: RelayClientWithBotC } = ClientFactoryRelay({...GameRelay, name: "relay_c"}, InProgressRelay, RelayStrategy(getProblems("C")), description);
export const { ClientWithBot: RelayClientWithBotD } = ClientFactoryRelay({...GameRelay, name: "relay_d"}, InProgressRelay, RelayStrategy(getProblems("D")), description);
export const { ClientWithBot: RelayClientWithBotE } = ClientFactoryRelay({...GameRelay, name: "relay_e"}, InProgressRelay, RelayStrategy(getProblems("E")), description);
export const { ClientWithBot: StrategyClientWithBotC } = ClientFactory({...GameCircleC, name: "remove-from-circle_c"}, MyBoard, strategyWrapper("C"), descriptionC);
export const { ClientWithBot: StrategyClientWithBotD } = ClientFactory({...GameCircleD, name: "remove-from-circle_d"}, MyBoard, strategyWrapper("D"), descriptionD);
export const { ClientWithBot: StrategyClientWithBotE } = ClientFactory({...GameCircleE, name: "remove-from-circle_e"}, MyBoard, strategyWrapper("E"), descriptionE);


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
