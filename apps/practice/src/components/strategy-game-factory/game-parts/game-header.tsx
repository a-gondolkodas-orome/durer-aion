import { Link, useLocation } from 'react-router';
import { useTranslation, LanguageSelector } from '../../../language';
import { ThemeSwitcher } from '../../../theme';
import { gameList } from '../../games/gameList';

export const GameHeader = () => {
  const { t } = useTranslation();
  const gameId = useLocation().pathname.split('/').pop();
  const gameEntry = gameList[gameId!];
  const title = t(gameEntry?.title ?? gameEntry?.name ?? '');
  return (
  <>
    <header className="flex flex-wrap items-baseline border-b pb-2 mb-2">
      <Link
        to='/'
        className="md:basis-36 text-sm whitespace-nowrap"
      >
        ← <span className="hidden md:inline">{t({ hu: 'Vissza a listához', en: 'Back to list' })}</span>
      </Link>
      <h1 className="grow text-blue-600 dark:text-blue-400 text-center">
        {title}
      </h1>
      <span className="md:basis-36 text-sm ml-auto hidden md:flex items-center justify-end gap-2">
        <a
          href="https://forms.gle/7DwugmXNrvKgkiiu8"
          rel="noreferrer"
          target="_blank"
          className="whitespace-nowrap"
        >
          {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
        </a>
        <ThemeSwitcher />
        <LanguageSelector />
      </span>
    </header>
  </>);
};
