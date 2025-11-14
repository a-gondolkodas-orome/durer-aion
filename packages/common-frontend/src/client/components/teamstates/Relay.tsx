import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { dictionary } from "../../text-constants";
import { useGame } from "./GameContext";
import React, { Suspense } from "react";

const testId = "relayRoot";

function Relay(props: { state: TeamModelDto }) {
  const { RelayClient } = useGame();
  switch (props.state.relayMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          {RelayClient ? <Suspense fallback={<div>Játék betöltése…</div>}>
                      <RelayClient
                        category={props.state.category as "C" | "D" | "E"}
                        credentials={props.state.credentials}
                        matchID={(props.state.strategyMatch  as InProgressMatchStatus).matchID}
                      />
                    </Suspense> : <>no relay client in game context</>}
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>{dictionary.relay.badCategory}</div>;
  }
}

export default Relay;