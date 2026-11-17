import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

// The build's commit, shortened as `git log --oneline` shows it, and — where
// the page reports to umami — one sentence saying so (README § Usage tracking).
// One line with a separator where it fits; on a phone, where it would wrap and
// leave the separator dangling, two lines without one.
export function SiteFooter(props: { gitCommitHash: string, trackingNote: boolean }) {
  const { t } = useTranslation();
  return (
    <footer style={{
      textAlign: "center",
      color: "#777",
      fontSize: '70%',
      marginTop: 'auto',
      marginBottom: '8px'
    }}>
      {props.trackingNote && <>
        {t('footer.tracking')}
        <Box component="span" aria-hidden="true" sx={{ display: { xs: 'none', sm: 'inline' } }}>{' | '}</Box>
      </>}
      <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
        {t('footer.version', { hash: props.gitCommitHash.slice(0, 7) })}
      </Box>
    </footer>
  );
}
