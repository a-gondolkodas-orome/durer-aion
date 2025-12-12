import React from 'react';
import { Link } from 'react-router';
import {
  Disclosure, DisclosureButton, DisclosurePanel,
  Dialog, DialogPanel, DialogTitle,
  Description
} from '@headlessui/react';

export const GameSidebar = ({
  roleLabels,
  stepDescription,
  ctx,
  moves
}) => {
  return (
    <div className="p-2 flex flex-col grow shrink-0 basis-64">
      <p className="text-center font-bold text-lg basis-14">
        {getCtaText(ctx)}
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
            {roleLabels ? roleLabels[0] : "Kezdő leszek"}
          </button>
          <button
            className="cta-button"
            onClick={() => moves.chooseRole(1)}
          >
            {roleLabels ? roleLabels[1] : "Második leszek"}
          </button>
        </span>
      )}
      <button
        className="cta-button mt-[2vh]"
        onClick={() => moves.startNewGame()}>
        Új játék
      </button>
    </div>
  );
};

export const GameHeader = ({ title }) => {
  return (
  <>
    <header className="flex flex-wrap items-baseline">
      <Link
        to='/'
        className="rounded-lg px-2 md:px-4 bg-blue-400 hover:bg-blue-600 focus:bg-blue-600 md:basis-44 text-black no-underline"
      >← <span className="hidden md:inline">Vissza a listához</span></Link>
      <h1 className="grow text-blue-600 font-bold pb-4 text-center">
        {title}
      </h1>
      <span className="basis-44 text-right hidden md:inline">
        <a
          href="https://forms.gle/7DwugmXNrvKgkiiu8"
          target="_blank"
          className="px-4"
        >
          Hibabejelentő
        </a>
      </span>
    </header>
    <hr />
  </>);
};

export const GameFooter = () => {
  return (
    <footer className="text-right md:hidden">
      <a
        href="https://forms.gle/7DwugmXNrvKgkiiu8"
        target="_blank"
        className="px-4"
      >
        Hibabejelentő
      </a>
    </footer>
  );
};

export const GameRule = ({ ruleDescription }) => {
  return <section className="flex justify-center mb-4 mt-1 max-w-[100ch]">
    <Disclosure defaultOpen>
      {({ open }) => (
        <div className="border-2 rounded-sm grow">
          <DisclosureButton className="w-full bg-slate-200 text-xl flex justify-center">
            <span className="grow">Játékszabályok</span>
            { !open && <span className="text-right pr-4">▽</span>}
            { open && <span className="text-right pr-4" style={{ transform: 'scaleY(-1)' }}>▽</span>}
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

export const GameEndDialog = ({ isOpen, setIsOpen, startNewGame, isRoleSelectorWinner }) => {
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
              A játék véget ért
            </DialogTitle>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-slate-200 rounded-sm text-2xl px-1"
            >×</button>
          </header>
          <Description className="text-lg block text-justify">
            {getResultDescription(isRoleSelectorWinner)}
          </Description>

          <button onClick={() => startNewGame()} className="cta-button mt-2">
            Új játék
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const getCtaText = ({ phase, shouldRoleSelectorMoveNext, isRoleSelectorWinner }) => {
  if (phase === 'roleSelection') return 'Válassz szerepet, utána indul a játék!';
  if (phase === 'play') return shouldRoleSelectorMoveNext ? 'Te jössz' : 'Mi jövünk';
  if (phase === 'gameEnd') return getResultDescription(isRoleSelectorWinner);
};

const getResultDescription = isRoleSelectorWinner => isRoleSelectorWinner
  ? 'Nyertél. Gratulálunk! :)'
  : 'Sajnos, most nem nyertél, de ne add fel.';
