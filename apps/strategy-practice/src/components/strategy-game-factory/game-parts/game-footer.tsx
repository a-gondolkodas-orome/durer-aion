import { useTranslation } from 'react-i18next';
import { LanguageSelector } from 'language';
import { ThemeSwitcher } from '../../../theme';
import { gameList } from '../../games/gameList';
import { useGameKey } from '../../games/game-key';

const toWesternOrder = (name: string) => {
  const [family, ...given] = name.split(' ');
  return [...given, family].join(' ');
};

export const GameFooter = () => {
  const { t, i18n } = useTranslation('factory');
  const gameId = useGameKey();
  const credit = gameId === undefined ? undefined : gameList[gameId].credit;
  // The registry writes names in Hungarian order, family name first.
  const names = (list: string[]) => (i18n.language === 'hu' ? list : list.map(toWesternOrder)).join(', ');
  return (
    <footer className="text-right">
      { credit !== undefined && (
        <p className="px-2 font-light text-sm">
          { (credit.suggestedBy || []).length
            ? t('credit.suggestedBy', { names: names(credit.suggestedBy!) })
            : ''}
          { (credit.developedBy || []).length
            ? ' ' + t('credit.developedBy', { names: names(credit.developedBy!) })
            : ''}
        </p>
      )}
      <div className="primary-footer">
        <a
          href="https://forms.gle/7DwugmXNrvKgkiiu8"
          target="_blank"
          rel="noreferrer"
          className="primary-link"
        >
          {t('bugReport')}
        </a>
        <ThemeSwitcher />
        <LanguageSelector />
      </div>
    </footer>
  );
};
