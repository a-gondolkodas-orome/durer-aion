import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from 'language';
import { useGameKey } from '../games/game-key';

// `index.html` carries the Hungarian title and `lang` for the moment before the
// script runs; from then on both follow the chosen language and the route.
export const useDocumentTitle = () => {
  const { language } = useLanguage();
  const { t } = useTranslation('overview');

  const gameId = useGameKey();
  const site = t('siteName');
  // The card name, not the game page's longer `title`: a tab has little room.
  const title = gameId === undefined ? site : `${t(`${gameId}.name`, { ns: 'catalog' })} – ${site}`;

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = language;
  }, [title, language]);
};
