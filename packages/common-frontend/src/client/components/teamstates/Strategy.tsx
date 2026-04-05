import { useTranslation } from "react-i18next";
import { InProgressMatchStatus, TeamModelDto } from "../../dto/TeamStateDto";
import { useGame } from "./GameContext";
import { Suspense } from "react";

const testId = "strategyRoot";

export function Strategy(props: { state: TeamModelDto }) {
  const { t } = useTranslation();
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
      return <div data-testId={testId}>{t('strategy.notSupported')}</div>;
  }
}
