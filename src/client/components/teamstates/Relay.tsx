import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { FinishedRelay } from "./FinishedRelay";
import { DurerOldRelayClient, DurerXVIRelayClient } from "../ReactClient";

const testId = "relayRoot";

export function Relay(props: { state: TeamModelDto }, score: number) {
  switch (props.state.relayMatch.state) {
    case "FINISHED":
      return (
        <div data-testId={testId}>
          <FinishedRelay state={props.state} />
        </div>
      );
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          <DurerOldRelayClient
            category={props.state.category as string}
            credentials={props.state.credentials}
            matchID={(props.state.relayMatch as InProgressMatchStatus).matchID}
          />
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>ROSSZ KATEGÓRIA</div>;
  }
}
