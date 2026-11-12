import { strategyPoints } from 'game';
import type { LiveGameResult } from 'schemas';
import { useBackToHome, useTeamState } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';
import { EndCard } from './EndCard';
import { StrategyGamesTable, StrategyOutcome } from './ResultTables';

/**
 * The strategy match's end screen: its score, live games and how points follow, and
 * the way home, or back to the board as the match ended.
 */
export function StrategyEndTable(props: { allPoints: number, liveResults: LiveGameResult[], onViewBoard?: () => void }) {
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
      onClose={props.onViewBoard && { label: t('strategy.viewBoard'), onClick: props.onViewBoard }}
    >
      <StrategyGamesTable results={props.liveResults} points={props.allPoints}/>
      <StrategyOutcome results={props.liveResults} points={props.allPoints}/>
    </EndCard>
  );
}
