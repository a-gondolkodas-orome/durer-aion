import React from 'react';
import { Link, useLocation } from 'react-router';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useTranslation } from '../../language/translate';
import { LanguageSelector } from '../../language/language-selector';
import { gameList } from '../../games/gameList';

export const GameHeader = () => {
  const { t } = useTranslation();
  const gameId = useLocation().pathname.split('/').pop();
  const gameEntry = gameList[gameId];
  const title = t(gameEntry?.title || gameEntry?.name);
  return (
  <>
    <header className="flex flex-wrap items-baseline">
      <Link
        to='/'
        className="md:basis-44 text-sm text-blue-600 hover:underline whitespace-nowrap"
      >← <span className="hidden md:inline">{t({ hu: 'Vissza a listához', en: 'Back to list' })}</span></Link>
      <h1 className="grow text-blue-600 font-bold pb-4 text-center">
        {title}
      </h1>
      <span className="md:hidden ml-auto">
        <LanguageSelector />
      </span>
      <span className="basis-44 text-right hidden md:flex items-center justify-end gap-2">
        <a
          href="https://forms.gle/7DwugmXNrvKgkiiu8"
          rel="noreferrer"
          target="_blank"
          className="px-2"
        >
          {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
        </a>
        <LanguageSelector />
      </span>
    </header>
    <hr />
  </>);
};

export const GameFooter = () => {
  const { t } = useTranslation();
  const gameId = useLocation().pathname.split('/').pop();
  const credit = gameList[gameId]?.credit;
  return (
    <footer className="text-right">
      { credit !== undefined && (
        <p className ="px-2 text-gray-800 font-light text-sm">
          { (credit.suggestedBy || []).length
            ? t({
              hu: `A játékot javasolta: ${credit.suggestedBy.join(', ')}.`,
              en: `Suggested by: ${credit.suggestedBy.join(', ')}.`
            })
            : ''}
          { (credit.developedBy || []).length
            ? ' ' + t({
              hu: `A játékot programozta: ${credit.developedBy.join(', ')}.`,
              en: `Developed by: ${credit.developedBy.join(', ')}.`
            })
            : ''}
        </p>
      )}
      <a
        href="https://forms.gle/7DwugmXNrvKgkiiu8"
        target="_blank"
        rel="noreferrer"
        className="px-2 md:hidden"
      >
        {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
      </a>
    </footer>
  );
};

export const GameRule = ({ ruleDescription }) => {
  const { t } = useTranslation();
  return <section className="flex justify-center mb-4 mt-1 max-w-[100ch]">
    <Disclosure defaultOpen>
      {({ open }) => (
        <div className="border-2 rounded-sm grow">
          <DisclosureButton className="w-full bg-slate-200 text-xl flex justify-center">
            <span className="grow">{t({ hu: 'Játékszabályok', en: 'Game rules' })}</span>
            { !open && <span className="text-right pr-4" aria-hidden="true">▽</span>}
            { open && <span className="text-right pr-4" aria-hidden="true" style={{ transform: 'scaleY(-1)' }}>▽</span>}
          </DisclosureButton>
            <DisclosurePanel className="w-full p-2">
              <p className="text-justify">
                {t(ruleDescription)}
              </p>
            </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  </section>;
};
