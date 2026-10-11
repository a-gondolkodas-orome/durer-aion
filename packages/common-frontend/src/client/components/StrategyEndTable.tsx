import { strategyPoints } from 'game';
import type { LiveGameResult } from 'schemas';
import { useBackToHome, useTeamState } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';
import { EndCard } from './EndCard';
import { PointsScale, StrategyGamesTable } from './ResultTables';

/** The strategy match's end screen: its score, live games and points scale. */
export function StrategyEndTable(props: { allPoints: number, liveResults: LiveGameResult[] }) {
  const backToHome = useBackToHome();
  const team = useTeamState();
  const { t } = useTranslation();
  return (
    <EndCard
      title={t('strategy.endTable.title')}
      points={props.allPoints}
      max={strategyPoints(0)}
      reminder={team?.relayMatch.state === 'NOT STARTED' ? t('strategy.endTable.reminder') : undefined}
      backLabel={t('general.backHome')}
      onBack={backToHome}
    >
      <StrategyGamesTable results={props.liveResults}/>
      <PointsScale points={props.allPoints}/>
    </EndCard>
  );
}
