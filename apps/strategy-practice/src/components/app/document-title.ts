import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useLanguage, translate, type I18nString } from 'language';
import { gameList } from '../games/gameList';

const siteName: I18nString = { hu: 'Dürer játékok', en: 'Dürer games' };

// `index.html` carries the Hungarian title and `lang` for the moment before the
// script runs; from then on both follow the chosen language and the route.
export const useDocumentTitle = () => {
  const { language } = useLanguage();
  const { pathname } = useLocation();

  const gameId = /^\/game\/([^/]+)$/.exec(pathname)?.[1];
  // The card name, not the game page's longer `title`: a tab has little room.
  const game = gameId === undefined ? undefined : gameList[gameId];
  const site = translate(siteName, language);
  const title = game ? `${translate(game.name, language)} – ${site}` : site;

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = language;
  }, [title, language]);
};
