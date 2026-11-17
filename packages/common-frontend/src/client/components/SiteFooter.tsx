import React from 'react';
import { useTranslation } from 'react-i18next';

// The build's commit, shortened as `git log --oneline` shows it, and — where
// the page reports to umami — one sentence saying so (README § Usage tracking).
export function SiteFooter(props: { gitCommitHash: string, trackingNote: boolean }) {
  const { t } = useTranslation();
  return (
    <footer style={{
      textAlign: "center",
      color: "#777",
      fontSize: '70%',
      marginBottom: '8px'
    }}>
      {props.trackingNote && <div>{t('footer.tracking')}</div>}
      <div>{t('footer.version', { hash: props.gitCommitHash.slice(0, 7) })}</div>
    </footer>
  );
}
