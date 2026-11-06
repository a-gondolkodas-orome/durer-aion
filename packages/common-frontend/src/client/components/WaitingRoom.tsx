import { Stack, alpha } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// Nothing renders this: `pageState` is DISCLAIMER | HOME | RELAY | STRATEGY, with
// no WAITING among them, and nothing on the server gates on a competition-wide
// window either — #345 removed the unused `checkGlobalTime()` and the config
// behind it, the round's start being enforced by handing the join codes out when
// it opens. This screen and its `waitingRoom.*` keys in both locales are what a
// WAITING status would render if the deadline #345 leaves open is ever built: as
// admin-set state in the database, not as an environment variable.
export function WaitingRoom() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      width: 600,
      padding: "40px",
      marginTop: "40px",
      backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
      borderRadius: "25px",
    }}>
      <Stack sx={{
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: "50px",
      }}>
        {t('waitingRoom.soon')}
      </Stack>
      <Stack sx={{
        fontSize: 32,
        marginBottom: "40px",
        marginLeft: "30px",
      }}>
        {t('waitingRoom.remainingStart')} #:##:## {t('waitingRoom.remainingEnd')}
      </Stack>
      <Stack sx={{
        fontSize: 24,
        marginLeft: "30px",
      }}>
        {t('waitingRoom.instruction')}
      </Stack>

    </Stack>
  )
}
