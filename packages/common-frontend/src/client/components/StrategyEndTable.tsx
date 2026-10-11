import { Box } from '@mui/material';
import { STRATEGY_POINTS_BY_LOSSES, strategyPoints } from 'game';
import type { LiveGameResult } from 'schemas';
import { useRefreshTeamState, useTeamState, useToHome } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';
import { EndCard } from './EndCard';
import { ResultTable, StrategyGamesTable, WON } from './ResultTables';

/**
 * How the strategy points follow from the losses, the team's own column
 * marked if it scored. Each column's points differ, so the points pick it out.
 */
function PointsScale(props: { points: number }) {
  const { t } = useTranslation();
  const last = STRATEGY_POINTS_BY_LOSSES.length - 1;
  const mark = (points: number) => points === props.points ? { backgroundColor: WON, fontWeight: 700 } : undefined;
  return <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    <ResultTable
      centred
      headerLabel={t('strategy.endTable.losses')}
      columnLabels={STRATEGY_POINTS_BY_LOSSES.map((_, losses) => `${losses}${losses === last ? '+' : ''}`)}
      rows={[{
        label: t('strategy.endTable.points'),
        cells: STRATEGY_POINTS_BY_LOSSES.map(points => ({ content: points, sx: mark(points) })),
      }]}
    />
    <Box sx={{ fontSize: '13px', color: '#666', lineHeight: 1.6, textAlign: 'center' }}>
      {t('strategy.endTable.rules')}
    </Box>
  </Box>;
}

/** The strategy match's end screen: its score, live games and points scale. */
export function StrategyEndTable(props: { allPoints: number, liveResults: LiveGameResult[] }) {
  const toHome = useToHome();
  const refreshState = useRefreshTeamState();
  const team = useTeamState();
  const { t } = useTranslation();
  // Named so the handlers below can stay synchronous: React ignores what an
  // event handler returns, so an async one leaves its promise unhandled.
  const backToHome = async () => {
    await refreshState();
    await toHome();
    window.location.reload();
  };
  return (
    <EndCard
      title={t('strategy.endTable.title')}
      points={props.allPoints}
      max={strategyPoints(0)}
      reminder={team?.relayMatch.state === 'NOT STARTED' ? t('strategy.endTable.reminder') : undefined}
      backLabel={t('relay.endTable.back')}
      onBack={() => void backToHome()}
    >
      <StrategyGamesTable results={props.liveResults}/>
      <PointsScale points={props.allPoints}/>
    </EndCard>
  );
}
