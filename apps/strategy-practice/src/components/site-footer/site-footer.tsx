import { useTranslation } from 'react-i18next';

// The tracking note and the build's commit, as the competition's login page and
// the relay practice site show them (README § Usage tracking, at the repo root).
export const SiteFooter = () => {
  const { t } = useTranslation('footer');
  const hash = import.meta.env.VITE_GIT_COMMIT_HASH;
  return (
    <div className="px-2 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
      <p>{t('tracking')}</p>
      {hash && <p>{t('version', { hash: hash.slice(0, 7) })}</p>}
    </div>
  );
};
