import { strategyPoints } from 'game';
import type { LiveGameResult } from 'schemas';
import { useBackToHome, useTeamState } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';
import { EndCard } from './EndCard';
import { PointsScale, StrategyGamesTable } from './ResultTables';

/**
 * The strategy match's end screen: its score, live games and points scale. Its
 * button goes home, or with `onClose` just closes it, as on the home page.
 */
export function StrategyEndTable(props: { allPoints: number, liveResults: LiveGameResult[], onClose?: () => void }) {
  const backToHome = useBackToHome();
  const team = useTeamState();
  const { t } = useTranslation();
  return (
    <EndCard
      title={t('strategy.endTable.title')}
      points={props.allPoints}
      max={strategyPoints(0)}
      reminder={team?.relayMatch.state === 'NOT STARTED' ? t('strategy.endTable.reminder') : undefined}
      backLabel={props.onClose ? t('general.close') : t('general.backHome')}
      onBack={props.onClose ?? backToHome}
    >
      <StrategyGamesTable results={props.liveResults}/>
      <PointsScale points={props.allPoints}/>
    </EndCard>
  );
}
