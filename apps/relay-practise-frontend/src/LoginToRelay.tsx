import SelectRelayRound from './SelectRound';
import { useTranslation } from 'react-i18next';
import { Stack } from '@mui/material';

export function LoginToRelay() {
  const { t } = useTranslation();

  return (
    <Stack data-testid="loginRoot">
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
        <SelectRelayRound />
      </Stack>
    </Stack>
  )
}
