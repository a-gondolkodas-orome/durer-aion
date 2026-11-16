import { useTranslation } from 'react-i18next';
import { Link, useRouteError } from 'react-router';

export const ErrorPage = () => {
  const { t } = useTranslation('overview');
  const error = useRouteError() as { status?: number } | null;
  const notFound = !error || error?.status === 404;

  return (
    <main className="p-2">
      <p>{notFound ? t('errorPage.notFound') : t('errorPage.unexpected')}</p>
      <Link to="/">{t('errorPage.backToHome')}</Link>
    </main>
  );
};
