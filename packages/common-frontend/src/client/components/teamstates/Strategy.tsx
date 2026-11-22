import { useTranslation } from "react-i18next";
import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { useGame } from "./GameContext";
import { Loading } from "../Loading";
import { Suspense } from "react";

const testId = "strategyRoot";

export function Strategy(props: { state: TeamModelDto }) {
  const { t } = useTranslation();
  const StrategyClient = useGame().StrategyClient;
  switch (props.state.strategyMatch.state) {
    case "FINISHED":
    case "IN PROGRESS":
      // See the same check in Relay.tsx.
      if (!StrategyClient) throw new Error('GameProvider gives no StrategyClient');
      return (
        <div data-testid={testId}>
          <Suspense fallback={<Loading/>}>
            <StrategyClient
              competition={props.state.competition}
              credentials={props.state.credentials}
              matchID={(props.state.strategyMatch  as InProgressMatchStatus).matchID}
            />
          </Suspense>
        </div>
      );
    case "NOT STARTED":
    default:
      return <div data-testid={testId}>{t('strategy.notSupported')}</div>;
  }
}
