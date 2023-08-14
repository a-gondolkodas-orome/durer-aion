import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { DurerXVIStrategyClient } from "../ReactClient";
import { dictionary } from "../../text-constants";

const testId = "strategyRoot";

export function Strategy(props: { state: TeamModelDto }) {
  switch (props.state.strategyMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          <DurerXVIStrategyClient
            category={props.state.category as "C" | "D" | "E"}
            credentials={props.state.credentials}
            matchID={
              (props.state.strategyMatch as InProgressMatchStatus).matchID
            }
          />
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>{dictionary.strategy.notSupported}</div>;
  }
}
