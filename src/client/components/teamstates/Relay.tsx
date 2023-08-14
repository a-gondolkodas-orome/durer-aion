import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { DurerXVIRelayClient } from "../ReactClient";
import { dictionary } from "../../text-constants";

const testId = "relayRoot";

export function Relay(props: { state: TeamModelDto }) {
  switch (props.state.relayMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          <DurerXVIRelayClient
            category={props.state.category as "C" | "D" | "E"}
            credentials={props.state.credentials}
            matchID={(props.state.relayMatch as InProgressMatchStatus).matchID}
          />
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>{dictionary.relay.badCategory}</div>;
  }
}
