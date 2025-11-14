import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { useGame } from "./GameContext";
import { dictionary } from "../../text-constants";
import React, { Suspense } from "react";

const testId = "strategyRoot";

function Strategy(props: { state: TeamModelDto }) {
  const StrategyClient = useGame().StrategyClient;
  switch (props.state.strategyMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          
          {StrategyClient ? <Suspense fallback={<div>Játék betöltése…</div>}>
            <StrategyClient
              category={props.state.category as "C" | "D" | "E"}
              credentials={props.state.credentials}
              matchID={(props.state.strategyMatch  as InProgressMatchStatus).matchID}
            />
          </Suspense> : <>no strategy client in game context</>}
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>{dictionary.strategy.notSupported}</div>;
  }
}

export default Strategy;