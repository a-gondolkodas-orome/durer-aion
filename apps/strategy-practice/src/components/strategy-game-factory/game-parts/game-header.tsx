import { Link, useLocation } from 'react-router';
import { useTranslation, LanguageSelector } from 'language';
import { ThemeSwitcher } from '../../../theme';
import { gameList } from '../../games/gameList';

export const GameHeader = () => {
  const { t } = useTranslation();
  const gameId = useLocation().pathname.split('/').pop();
  const gameEntry = gameList[gameId!];
  const title = t(gameEntry?.title ?? gameEntry?.name ?? '');
  return (
  <>
    <header className="primary-header">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to='/'
            className="primary-link text-sm font-medium whitespace-nowrap"
          >
            ← <span className="hidden sm:inline">{t({ hu: 'Vissza a listához', en: 'Back to list' })}</span>
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
              {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
            </a>
            <ThemeSwitcher />
            <LanguageSelector />
          </span>
        </div>
      </div>
    </header>
  </>);
};
