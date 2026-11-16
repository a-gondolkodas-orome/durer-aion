import { useTranslation } from "react-i18next";
import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { useGame } from "./GameContext";
import { Loading } from "../Loading";
import React, { Suspense } from "react";

const testId = "relayRoot";

export function Relay(props: { state: TeamModelDto }) {
  const { RelayClient } = useGame();
  const { t } = useTranslation();
  switch (props.state.relayMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      // Every app that renders this provides its client, so a missing one is a
      // wiring bug: thrown for the ErrorBoundary around the page to report.
      if (!RelayClient) throw new Error('GameProvider gives no RelayClient');
      return (
        <div data-testid={testId}>
          <Suspense fallback={<Loading/>}>
            <RelayClient
              competition={props.state.competition}
              teamName={props.state.teamName}
              credentials={props.state.credentials}
              matchID={(props.state.relayMatch  as InProgressMatchStatus).matchID}
            />
          </Suspense>
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testid={testId}>{t('relay.error.noMatch')}</div>;
  }
}
