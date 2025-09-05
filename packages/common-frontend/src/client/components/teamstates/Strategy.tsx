import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { useGame } from "./GameContext";
import { dictionary } from "../../text-constants";
import React from "react";

const testId = "strategyRoot";

export function Strategy(props: { state: TeamModelDto }) {
  const StrategyClient = useGame().StrategyClient;
  switch (props.state.strategyMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          {StrategyClient ? React.cloneElement(StrategyClient as React.ReactElement, {
            "category": props.state.category as "C" | "D" | "E",
            "credentials": props.state.credentials,
            "matchID": (props.state.strategyMatch as InProgressMatchStatus).matchID,
          }) : <>no strategy client in game context</>}
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>{dictionary.strategy.notSupported}</div>;
  }
}
