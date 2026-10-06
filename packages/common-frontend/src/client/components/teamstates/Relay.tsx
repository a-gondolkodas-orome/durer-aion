import { useTranslation } from "react-i18next";
import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { useGame } from "./GameContext";
import { isCompetitionCategory } from "schemas";
import React, { Suspense } from "react";

const testId = "relayRoot";

export function Relay(props: { state: TeamModelDto }) {
  const { RelayClient } = useGame();
  const { t } = useTranslation();
  switch (props.state.relayMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      return (
        <div data-testid={testId}>
          {RelayClient ? <Suspense fallback={<div>{t('general.loading')}</div>}>
            {/* The relay practice site's categories (C+…) are not the competition's: its client goes by `teamName`. */}
            <RelayClient
              category={isCompetitionCategory(props.state.category) ? props.state.category : undefined}
              teamName={props.state.teamName}
              credentials={props.state.credentials}
              matchID={(props.state.relayMatch  as InProgressMatchStatus).matchID}
            />
          </Suspense> : <>no relay client in game context</>}
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testid={testId}>{t('relay.error.badCategory')}</div>;
  }
}
