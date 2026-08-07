import { useLocation } from 'react-router';
import { useTranslation, LanguageSelector } from 'language';
import { ThemeSwitcher } from '../../../theme';
import { gameList } from '../../games/gameList';

const toWesternOrder = (name: string) => {
  const [family, ...given] = name.split(' ');
  return [...given, family].join(' ');
};

export const GameFooter = () => {
  const { t } = useTranslation();
  const gameId = useLocation().pathname.split('/').pop();
  const credit = gameList[gameId!]?.credit;
  return (
    <footer className="text-right">
      { credit !== undefined && (
        <p className="px-2 font-light text-sm">
          { (credit.suggestedBy || []).length
            ? t({
              hu: `A játékot javasolta: ${credit.suggestedBy!.join(', ')}.`,
              en: `Suggested by: ${credit.suggestedBy!.map(toWesternOrder).join(', ')}.`
            })
            : ''}
          { (credit.developedBy || []).length
            ? ' ' + t({
              hu: `A játékot programozta: ${credit.developedBy!.join(', ')}.`,
              en: `Developed by: ${credit.developedBy!.map(toWesternOrder).join(', ')}.`
            })
            : ''}
        </p>
      )}
      <div className="px-2 md:hidden flex justify-end items-center gap-3">
        <a
          href="https://forms.gle/7DwugmXNrvKgkiiu8"
          target="_blank"
          rel="noreferrer"
        >
          {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
        </a>
        <ThemeSwitcher />
        <LanguageSelector />
      </div>
    </footer>
  );
};
