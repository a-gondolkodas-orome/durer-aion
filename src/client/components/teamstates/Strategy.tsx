import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { FinishedStrategy } from "./FinishedStrategy";
import { DurerXVIStrategyClient } from "../ReactClient";

const testId = "strategyRoot";

export function Strategy(props: { state: TeamModelDto }) {
  switch (props.state.strategyMatch.state) {
    case "FINISHED":
      return (
        <div data-testId={testId}>
          <FinishedStrategy state={props.state} />
        </div>
      );
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
      return <div data-testId={testId}>NEM TÁMOGATOTT JÁTÉKÁLLAPOT</div>;
  }
}
