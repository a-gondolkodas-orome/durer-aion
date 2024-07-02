import React from 'react';
import { Link } from 'react-router-dom';
import {
  Disclosure, DisclosureButton, DisclosurePanel,
  Dialog, DialogPanel, DialogTitle,
  Description
} from '@headlessui/react';

export const GameSidebar = ({
  firstRoleLabel,
  secondRoleLabel,
  stepDescription,
  ctx,
  moves
}) => {
  return (
    <div className="p-2 flex flex-col grow shrink-0 basis-64">
      <p className="text-center font-bold text-lg basis-[3.5rem]">
        {getCtaText(ctx)}
      </p>
      {ctx.phase === 'play' && ctx.shouldPlayerMoveNext === false && (
        <div
          className="animate-spin h-8 w-8 place-self-center border-t-blue-600 rounded-full border-4 mb-[4rem]"
        ></div>
      )}
      {ctx.phase === 'play' && ctx.shouldPlayerMoveNext && (
        <p className="italic text-justify basis-[6rem]">
          {stepDescription}
        </p>
      )}
      {ctx.phase === 'roleSelection' && (
        <span className="basis-[6rem]">
          <button
            className="cta-button js-first-player"
            onClick={() => moves.chooseRole(0)}
          >
            {firstRoleLabel || "Kezdő leszek"}
          </button>
          <button
            className="cta-button js-second-player"
            onClick={() => moves.chooseRole(1)}
          >
            {secondRoleLabel || "Második leszek"}
          </button>
        </span>
      )}
      <button
        className="cta-button mt-[2vh] js-restart-game"
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
        className="rounded-lg px-2 md:px-4 bg-blue-400 hover:bg-blue-600 md:basis-44 text-black no-underline"
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
        <div className="border-2 rounded grow">
          <DisclosureButton className="w-full bg-slate-200 text-xl flex justify-center">
            <span className="grow">Játékszabályok</span>
            { !open && <span className="text-right pr-4">⛛</span>}
            { open && <span className="text-right pr-4" style={{ transform: 'scaleY(-1)' }}>⛛</span>}
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

export const GameEndDialog = ({ isOpen, setIsOpen, startNewGame, isPlayerWinner }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true"></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="rounded bg-white max-w-sm w-full p-2">
          <header className="flex items-baseline mb-2">
            <DialogTitle className="grow block text-2xl text-center">
              A játék véget ért
            </DialogTitle>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-slate-200 rounded text-2xl px-1"
            >×</button>
          </header>
          <Description className="text-lg block text-justify">
            {getResultDescription(isPlayerWinner)}
          </Description>

          <button onClick={() => startNewGame()} className="cta-button mt-2">
            Új játék
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const getCtaText = ({ phase, shouldPlayerMoveNext, isPlayerWinner }) => {
  if (phase === 'roleSelection') return 'Válassz szerepet, utána indul a játék!';
  if (phase === 'play') return shouldPlayerMoveNext ? 'Te jössz' : 'Mi jövünk';
  if (phase === 'gameEnd') return getResultDescription(isPlayerWinner);
};

const getResultDescription = isPlayerWinner => isPlayerWinner
  ? 'Nyertél. Gratulálunk! :)'
  : 'Sajnos, most nem nyertél, de ne add fel.';
