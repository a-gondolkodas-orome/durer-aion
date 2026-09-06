import { Stack, alpha } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// Nothing renders this: `pageState` is DISCLAIMER | HOME | RELAY | STRATEGY, with
// no WAITING among them. It is the frontend half of issue #345 — the server's
// `checkGlobalTime()` computes WAITING and FINISHED and no route acts on either —
// and this screen, with its `waitingRoom.*` keys in both locales, is what a WAITING
// status would render once one does.
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
