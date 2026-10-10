import { Fragment } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button } from '@mui/material';
import { Stack } from '@mui/system';
import { STRATEGY_POINTS_BY_LOSSES, strategyPoints } from 'game';
import type { LiveGameResult } from 'schemas';
import { useRefreshTeamState, useToHome } from '../hooks/user-hooks';
import { useTranslation } from 'react-i18next';
import { ScoreHeadline, StrategyGamesTable } from './ResultTables';

/**
 * How the strategy points follow from the losses, the team's own step in bold
 * if it scored. Each step's points differ, so the points pick out the step.
 */
function PointsScale(props: { points: number }) {
  const { t } = useTranslation();
  const last = STRATEGY_POINTS_BY_LOSSES.length - 1;
  return <Box sx={{ fontSize: '13px', color: '#666', lineHeight: 1.6, textAlign: 'center' }}>
    {t('strategy.endTable.scale')}{' '}
    {STRATEGY_POINTS_BY_LOSSES.map((points, losses) => {
      const step = `${losses}${losses === last ? '+' : ''} → ${points}`;
      return <Fragment key={losses}>
        {points === props.points ? <b style={{ color: '#1a1a1a' }}>{step}</b> : step}
        {losses === last ? '.' : ', '}
      </Fragment>;
    })}
    <br/>
    {t('strategy.endTable.rules')}
  </Box>;
}

/**
 * Component to display an end game screen with close button, and score
 * @param props the match's points, and its live games' results in order
 * @returns End screen
 */
export function StrategyEndTable(props: { allPoints: number, liveResults: LiveGameResult[] }) {
  const theme = useTheme();
  const toHome = useToHome();
  const refreshState = useRefreshTeamState();
  const { t } = useTranslation();
  // Named so the handlers below can stay synchronous: React ignores what an
  // event handler returns, so an async one leaves its promise unhandled.
  const backToHome = async () => {
    await refreshState();
    await toHome();
    window.location.reload();
  };
  return (
    <Stack sx={{
      width: "750px",
      maxWidth: '100%',
      boxSizing: 'border-box',
      marginTop: '10px',
      marginBottom: '10px',
      borderRadius: '30px',
      backgroundColor: theme.palette.background.paper,
      padding: '25px',
      gap: '20px',
    }}>
      <Stack sx={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>
        {t('strategy.endTable.title')}
      </Stack>
      <ScoreHeadline points={props.allPoints} max={strategyPoints(0)}/>
      <StrategyGamesTable results={props.liveResults}/>
      <PointsScale points={props.allPoints}/>
      <Stack sx={{ fontSize: '15px', textAlign: 'center' }}>
        {t('strategy.endTable.reminder')}
      </Stack>
      <Button sx={{
        minWidth: '300px',
        height: '55px',
        fontSize: '22px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={() => void backToHome()}>
        {t('relay.endTable.back')}
      </Button>
    </Stack>
  )
}
