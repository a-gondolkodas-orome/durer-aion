import { Stack, alpha } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

export function WaitingRoom() {
  const theme = useTheme();
  const { t } = useTranslation(undefined, { keyPrefix: 'waitingRoom' });
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
        {t('soon')}
      </Stack>
      <Stack sx={{
        fontSize: 32,
        marginBottom: "40px",
        marginLeft: "30px",
      }}>
        {t('remainingStart')} #:##:## {t('remainingEnd')}
      </Stack>
      <Stack sx={{
        fontSize: 24,
        marginLeft: "30px",
      }}>
        {t('instruction')}
      </Stack>

    </Stack>
  )
}