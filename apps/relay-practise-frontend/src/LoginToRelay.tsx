import { Stack } from '@mui/system';
import SelectProblem from './SelectProblem';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material';

export function LoginToRelay() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack sx={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      alignItems: 'start',
      justifyContent: 'center',
    }} data-testId="loginRoot">
      <Stack sx={{
        width: '100%',
        maxWidth: 680,
        borderRadius: 5,
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 5 },
        backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
        boxShadow: '0 24px 60px rgba(36, 52, 112, 0.14)',
        backdropFilter: 'blur(10px)',
      }}>
        <Stack sx={{
          fontSize: { xs: '2rem', sm: '2.75rem' },
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.08,
        }}>
          {t('login.relayPractise')}
        </Stack>
        <Stack sx={{
          mt: 1.5,
          fontSize: { xs: '1.05rem', sm: '1.25rem' },
          lineHeight: 1.7,
          opacity: 0.8
        }}>
          <p>{t('login.relayPractiseDescription')}</p>
        </Stack>
        <Stack sx={{ mt: 4 }}>
          <SelectProblem />
        </Stack>
      </Stack>
    </Stack>
  )
}