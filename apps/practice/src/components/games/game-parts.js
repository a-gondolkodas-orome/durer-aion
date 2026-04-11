import React from 'react';
import { Link } from 'react-router';
import {
  Disclosure, DisclosureButton, DisclosurePanel,
  Dialog, DialogPanel, DialogTitle,
  Description
} from '@headlessui/react';
import { useTranslation } from '../language/translate';
import { LanguageSelector } from '../language/language-selector';

export const GameSidebar = ({
  roleLabels,
  stepDescription,
  ctx,
  moves
}) => {
  const { t } = useTranslation();
  const isNewGameAllowed = ctx.phase !== 'play' || ctx.shouldRoleSelectorMoveNext;
  return (
    <div className="p-2 flex flex-col grow shrink-0 basis-64">
      <p className="text-center font-bold text-lg basis-14">
        {t(getCtaText(ctx))}
      </p>
      {ctx.phase === 'play' && ctx.shouldRoleSelectorMoveNext === false && (
        <div
          className="animate-spin h-8 w-8 place-self-center border-t-blue-600 rounded-full border-4 mb-16"
        ></div>
      )}
      {ctx.phase === 'play' && ctx.shouldRoleSelectorMoveNext && (
        <p className="italic text-justify basis-24">
          {stepDescription}
        </p>
      )}
      {ctx.phase === 'roleSelection' && (
        <span className="basis-24">
          <button
            className="cta-button"
            onClick={() => moves.chooseRole(0)}
          >
            {t(roleLabels ? roleLabels[0] : { hu: 'Kezdő leszek', en: "I'll go first" })}
          </button>
          <button
            className="cta-button"
            onClick={() => moves.chooseRole(1)}
          >
            {t(roleLabels ? roleLabels[1] : { hu: 'Második leszek', en: "I'll go second" })}
          </button>
        </span>
      )}
      <button
        className="cta-button mt-[2vh]"
        disabled={!isNewGameAllowed}
        onClick={() => moves.startNewGame()}
      >
        {t({ hu: 'Új játék', en: 'New game' })}
      </button>
    </div>
  );
};

export const GameHeader = ({ title }) => {
  const { t } = useTranslation();
  return (
  <>
    <header className="flex flex-wrap items-baseline">
      <Link
        to='/'
        className={
          'rounded-lg px-2 md:px-4 bg-blue-400 hover:bg-blue-600' +
          ' focus:bg-blue-600 md:basis-44 text-black no-underline'
        }
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

export const GameFooter = ({ credit }) => {
  const { t } = useTranslation();
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
            { !open && <span className="text-right pr-4">▽</span>}
            { open && <span className="text-right pr-4" style={{ transform: 'scaleY(-1)' }}>▽</span>}
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

export const GameEndDialog = ({ isOpen, setIsOpen, startNewGame, isRoleSelectorWinner }) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true"></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="rounded-sm bg-white max-w-sm w-full p-2">
          <header className="flex items-baseline mb-2">
            <DialogTitle className="grow block text-2xl text-center">
              {t({ hu: 'A játék véget ért', en: 'Game over' })}
            </DialogTitle>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-slate-200 rounded-sm text-2xl px-1"
            >×</button>
          </header>
          <Description className="text-lg block text-justify">
            {t(getResultDescription(isRoleSelectorWinner))}
          </Description>

          <button onClick={() => startNewGame()} className="cta-button mt-2">
            {t({ hu: 'Új játék', en: 'New game' })}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const getCtaText = ({ phase, shouldRoleSelectorMoveNext, isRoleSelectorWinner }) => {
  if (phase === 'roleSelection') {
    return {
      hu: 'Válassz szerepet, utána indul a játék!',
      en: 'Choose a role to start the game!'
    };
  }
  if (phase === 'play') {
    return shouldRoleSelectorMoveNext
      ? { hu: 'Te jössz', en: 'Your turn' }
      : { hu: 'Mi jövünk', en: "Computer's turn" };
  }
  if (phase === 'gameEnd') return getResultDescription(isRoleSelectorWinner);
};

const getResultDescription = isRoleSelectorWinner => isRoleSelectorWinner
  ? { hu: 'Nyertél. Gratulálunk! :)', en: 'You won. Congratulations! :)' }
  : {
    hu: 'Sajnos, most nem nyertél, de ne add fel.',
    en: "Unfortunately you didn't win this time, but don't give up."
  };
