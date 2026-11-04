import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from 'language';
import { ThemeSwitcher } from '../../../theme';
import { useGameKey } from '../../games/game-key';

export const GameHeader = () => {
  const { t } = useTranslation('factory');
  const gameId = useGameKey();
  // The longer title where a game has one, its name otherwise.
  const title = gameId === undefined ? '' : t([`${gameId}.title`, `${gameId}.name`], { ns: 'catalog' });
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
