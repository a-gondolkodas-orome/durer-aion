import { useTranslation } from "react-i18next";
import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { useGame } from "./GameContext";
import React, { Suspense } from "react";

const testId = "relayRoot";

export function Relay(props: { state: TeamModelDto }) {
  const { RelayClient } = useGame();
  const { t } = useTranslation();
  switch (props.state.relayMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testId={testId}>
          {RelayClient ? <Suspense fallback={<div>{t('general.loading')}</div>}>
            <RelayClient
              category={props.state.category as "C" | "D" | "E"}
              credentials={props.state.credentials}
              matchID={(props.state.relayMatch  as InProgressMatchStatus).matchID}
            />
          </Suspense> : <>no relay client in game context</>}
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testId={testId}>{t('relay.badCategory')}</div>;
  }
}
