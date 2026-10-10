import { Button } from '@mui/material';
import { Stack } from '@mui/system';
import { useLogout, useRefreshTeamState, useToHome } from '../hooks/user-hooks';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { RelayResultsTable, ScoreHeadline } from './ResultTables';
import type { RelayProblemRow } from './relay-results';

/**
 * Component to display an end game screen with close button, and score
 * @param props selectRound: the close button leads back to the round selector
 * (by logging out) instead of reloading into the competition home page
 * @returns End screen
 */
export function RelayEndTable(props: { allPoints: number, problems: RelayProblemRow[], selectRound?: boolean }) {
  const theme = useTheme();
  const refreshState = useRefreshTeamState();
  const toHome = useToHome();
  const logout = useLogout();
  const { t } = useTranslation();
  // Named so the handlers below can stay synchronous: React ignores what an
  // event handler returns, so an async one leaves its promise unhandled.
  const backToHome = async () => {
    await refreshState();
    await toHome();
    if (props.selectRound) {
      // Logging out leads back to the round selector, and it also clears
      // the saved match so the round can be replayed later
      await logout();
    } else {
      window.location.reload();
    }
  };

  return (
    <Stack sx={{
      width: "750px",
      maxWidth: "100%",
      boxSizing: 'border-box',
      marginTop: '10px',
      marginBottom: '10px',
      borderRadius: '30px',
      backgroundColor: theme.palette.background.paper,
      padding: '25px',
      gap: '20px',
    }}>
      <Stack sx={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>
        {t('relay.endTable.title')}
      </Stack>
      <ScoreHeadline points={props.allPoints} max={props.problems.reduce((sum, it) => sum + it.maxPoints, 0)}/>
      <RelayResultsTable problems={props.problems} details/>
      {!props.selectRound && <Stack sx={{ fontSize: '15px', textAlign: 'center' }}>
        {t('relay.endTable.reminder')}
      </Stack>}
      <Button sx={{
        minWidth: '300px',
        height: '55px',
        fontSize: '22px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={() => void backToHome()}>
        {props.selectRound ? t('relay.endTable.selectOtherRound') : t('relay.endTable.back')}
      </Button>
    </Stack>
  )
}
