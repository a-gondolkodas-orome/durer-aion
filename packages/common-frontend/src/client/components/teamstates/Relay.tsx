import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { dictionary } from "../../text-constants";
import { useGame } from "./GameContext";
import React from "react";

const testId = "relayRoot";

function Relay(props: { state: TeamModelDto }) {
  const { RelayClient } = useGame();
  switch (props.state.relayMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          {RelayClient ? React.cloneElement(RelayClient as React.ReactElement, {
            "category": props.state.category as "C" | "D" | "E",
            "credentials": props.state.credentials,
            "matchID": (props.state.relayMatch as InProgressMatchStatus).matchID,
          }) : <>no relay client in game context</>}
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>{dictionary.relay.badCategory}</div>;
  }
}

export default Relay;