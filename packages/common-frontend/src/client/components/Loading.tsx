import { useTranslation } from 'react-i18next';

/** The text shown while a game or its first problem loads. */
export function Loading() {
  const { t } = useTranslation();
  return <div>{t('general.loading')}</div>;
}
