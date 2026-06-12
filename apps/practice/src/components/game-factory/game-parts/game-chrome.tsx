import React from 'react';
import { Link, useLocation } from 'react-router';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useTranslation, LanguageSelector } from '../../language';
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
        className="md:basis-44 text-sm whitespace-nowrap"
      >
        ← <span className="hidden md:inline">{t({ hu: 'Vissza a listához', en: 'Back to list' })}</span>
      </Link>
      <h1 className="grow text-blue-600 text-center">
        {title}
      </h1>
      <span className="md:hidden ml-auto">
        <LanguageSelector />
      </span>
      <span className="basis-44 ml-auto hidden md:flex items-center justify-end gap-2">
        <a
          href="https://forms.gle/7DwugmXNrvKgkiiu8"
          rel="noreferrer"
          target="_blank"
        >
          {t({ hu: 'Hibabejelentő', en: 'Bug report' })}
        </a>
        <LanguageSelector />
      </span>
    </header>
  </>);
};

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

export const GameRule = ({ ruleDescription }: { ruleDescription: React.ReactNode }) => {
  const { t } = useTranslation();
  return <section className="flex justify-center mb-4 mt-1 max-w-[100ch]">
    <Disclosure defaultOpen>
      {({ open }) => (
        <div className="border-2 rounded-sm grow">
          <DisclosureButton
            className="w-full bg-slate-200 text-lg sm:text-xl flex justify-center"
          >
            <span className="grow">{t({ hu: 'Játékszabályok', en: 'Game rules' })}</span>
            <span
              className="text-right pr-4"
              aria-hidden="true"
              style={{ transform: open ? 'scaleY(-1)' : undefined }}
            >▽</span>
          </DisclosureButton>
            <DisclosurePanel className="w-full p-2">
              <p className="text-justify">
                {ruleDescription}
              </p>
            </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  </section>;
};
