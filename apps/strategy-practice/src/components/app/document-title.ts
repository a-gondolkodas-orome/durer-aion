import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from 'language';
import { gameList } from '../games/gameList';

// `index.html` carries the Hungarian title and `lang` for the moment before the
// script runs; from then on both follow the chosen language and the route.
export const useDocumentTitle = () => {
  const { language } = useLanguage();
  const { t } = useTranslation('overview');
  const { pathname } = useLocation();

  const gameId = /^\/game\/([^/]+)$/.exec(pathname)?.[1];
  // The card name, not the game page's longer `title`: a tab has little room.
  const game = gameId === undefined ? undefined : gameList[gameId];
  const site = t('siteName');
  const title = game ? `${t(`${gameId}.name`, { ns: 'catalog' })} – ${site}` : site;

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = language;
  }, [title, language]);
};
