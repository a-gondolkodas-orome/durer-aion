import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LanguageSelector, translate, useLanguage } from 'language';
import { ThemeSwitcher } from '../../../theme';
import { gameList } from '../../games/gameList';

export const GameHeader = () => {
  const { t } = useTranslation('factory');
  const { language } = useLanguage();
  const gameId = useLocation().pathname.split('/').pop();
  const gameEntry = gameList[gameId!];
  const title = translate(gameEntry?.title ?? gameEntry?.name ?? '', language);
  return (
  <>
    <header className="primary-header">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to='/'
            className="primary-link text-sm font-medium whitespace-nowrap"
          >
            ← <span className="hidden sm:inline">{t('backToList')}</span>
          </Link>
          <h1 className="flex-1 text-center text-xl sm:text-2xl">
            {title}
          </h1>
          <span className="hidden md:flex items-center justify-end gap-3 text-sm whitespace-nowrap">
            <a
              href="https://forms.gle/7DwugmXNrvKgkiiu8"
              rel="noreferrer"
              target="_blank"
              className="primary-link"
            >
              {t('bugReport')}
            </a>
            <ThemeSwitcher />
            <LanguageSelector />
          </span>
        </div>
      </div>
    </header>
  </>);
};
