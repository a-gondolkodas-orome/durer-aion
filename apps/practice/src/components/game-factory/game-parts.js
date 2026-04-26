import React from 'react';
import { Link } from 'react-router';
import {
  Disclosure, DisclosureButton, DisclosurePanel,
  Dialog, DialogPanel, DialogTitle,
  Description, Label, Field, Input
} from '@headlessui/react';
import { useTranslation } from '../language/translate';
import { LanguageSelector } from '../language/language-selector';

export const DEFAULT_PLAYER_NAMES = [
  { hu: '1. játékos', en: '1st player' },
  { hu: '2. játékos', en: '2nd player' }
];

const PLAYER_COLORS = [
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-400' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400' }
];

export const GameSidebar = ({
  roleLabels,
  stepDescription,
  ctx,
  moves,
  variants,
  selectedVariantIndex
}) => {
  const { t } = useTranslation();
  const isNewGameAllowed = ctx.phase !== 'play' || ctx.isClientMoveAllowed;
  const activeVariantHasBotStrategy = !!variants.find(v => v.originalIndex === selectedVariantIndex)?.botStrategy;

  return (
    <div className="p-2 flex flex-col grow shrink-0 basis-64 gap-3">
      <ModeSelector
        isHumanVsHumanGame={ctx.isHumanVsHumanGame}
        onSwitchMode={moves.switchMode}
        disabled={!isNewGameAllowed}
      />
      {variants.length > 1 && (
        <DifficultySelector
          variants={variants}
          selectedIndex={selectedVariantIndex}
          onSelect={moves.setDifficulty}
          disabled={!isNewGameAllowed}
        />
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-col gap-3">
        {ctx.isHumanVsHumanGame && ctx.phase !== 'roleSelection'
          ? <PlayerTurnPanel ctx={ctx} />
          : <p className="text-center font-bold text-lg">{t(getCtaText(ctx))}</p>
        }

        {ctx.phase === 'play' && (
          <div className="relative flex justify-center">
            {!ctx.isHumanVsHumanGame && !ctx.isClientMoveAllowed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner />
              </div>
            )}
            <p className={`italic text-justify ${!ctx.isClientMoveAllowed ? 'invisible' : ''}`}>
              {stepDescription}
            </p>
          </div>
        )}

        {ctx.phase === 'roleSelection' && (
          ctx.isHumanVsHumanGame
            ? <PlayerNameSetup
                roleLabels={roleLabels}
                playerNames={ctx.playerNames}
                setPlayerNames={moves.setPlayerNames}
                onStart={moves.startGame}
              />
            : <RoleSelector
                roleLabels={roleLabels}
                onRoleSelection={moves.startGame}
                disabled={!activeVariantHasBotStrategy}
              />
        )}
      </div>

      <button
        className={`mt-auto rounded-lg py-1.5 px-4 w-full text-center border
          border-slate-300 text-slate-600 hover:bg-slate-50 focus:bg-slate-50
          disabled:opacity-40 disabled:cursor-not-allowed`}
        disabled={!isNewGameAllowed}
        onClick={() => moves.resetGameState()}
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

export const GameEndDialog = ({
  isOpen, setIsOpen, resetGameState, ctx
}) => {
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
            {t(getCtaText(ctx))}
          </Description>
          <button
            onClick={() => resetGameState()}
            className="cta-button mt-2"
          >
            {t({ hu: 'Új játék', en: 'New game' })}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const RoleSelector = ({ roleLabels, onRoleSelection, disabled }) => {
  const { t } = useTranslation();
  return <span className="basis-24 flex flex-col gap-2">
    {[
      { hu: 'Kezdő leszek', en: "I'll go first" },
      { hu: 'Második leszek', en: "I'll go second" }
    ].map((defaultLabel, i) => (
      <button
        key={i}
        data-testid={`role-btn-${i}`}
        className="rounded-lg py-2 px-4 w-full text-center font-semibold
          bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 text-white
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500 disabled:focus:bg-blue-500"
        disabled={disabled}
        onClick={() => onRoleSelection(i)}
      >
        {t(roleLabels ? roleLabels[i] : defaultLabel)}
      </button>
    ))}
  </span>;
};

const PlayerNameSetup = ({ roleLabels, playerNames, setPlayerNames, onStart }) => {
  const { t } = useTranslation();
  return (
  <span className="flex flex-col gap-3">
    <p className="text-sm text-slate-500 italic">
      {t({ hu: 'Neveitek (nem kötelező):', en: 'Your names (optional):' })}
    </p>
    <Field className="flex items-center gap-2">
      <Label className="font-semibold shrink-0 w-16 text-right text-sm">
        {t(roleLabels ? roleLabels[0] : { hu: 'Első', en: 'First' }) + ':'}
      </Label>
      <Input
        name="name_of_first_player"
        className="border border-slate-300 rounded-md text-slate-700 px-2 py-1 text-sm w-full
          focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder={t(DEFAULT_PLAYER_NAMES[0])}
        value={playerNames[0]}
        onChange={e => setPlayerNames([e.target.value.trim(), playerNames[1]])}
      />
    </Field>
    <Field className="flex items-center gap-2">
      <Label className="font-semibold shrink-0 w-16 text-right text-sm">
        {t(roleLabels ? roleLabels[1] : { hu: 'Második', en: 'Second' }) + ':'}
      </Label>
      <Input
        name="name_of_second_player"
        className="border border-slate-300 rounded-md text-slate-700 px-2 py-1 text-sm w-full
          focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder={t(DEFAULT_PLAYER_NAMES[1])}
        value={playerNames[1]}
        onChange={e => setPlayerNames([playerNames[0], e.target.value.trim()])}
      />
    </Field>
    <button
      data-testid="start-hh-game"
      className="rounded-lg py-2 px-4 w-full text-center font-semibold
        bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 text-white"
      onClick={onStart}
    >
      {t({ hu: 'Kezdhetjük!', en: "Let's go!" })}
    </button>
  </span>
  );
};

const Spinner = () => (
  <div className="animate-spin h-8 w-8 border-t-blue-600 rounded-full border-4"></div>
);

const DifficultySelector = ({ variants, selectedIndex, onSelect, disabled: fieldsetDisabled }) => {
  const { t } = useTranslation();
  const labelClass = (active, variantDisabled) => `min-w-0 grow py-1 px-2 text-center
    ${active && !variantDisabled
      ? `bg-blue-500 text-white font-semibold ${fieldsetDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`
      : variantDisabled || fieldsetDisabled
        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-600'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'}`;
  return (
    <fieldset className="overflow-hidden">
      <legend className="text-xs text-slate-500 mb-1.5">
        {t({ hu: 'Nehézség', en: 'Difficulty' })}
      </legend>
      <div className={`flex rounded-lg overflow-hidden border border-slate-300 text-sm
        has-focus-visible:ring-2 has-focus-visible:ring-red-400 has-focus-visible:ring-offset-1`}>
        {variants.map(v => (
          <label
            key={v.originalIndex}
            className={labelClass(v.originalIndex === selectedIndex, v.disabled)}
            title={v.disabled ? t({ hu: 'Nincs gépi stratégia megadva', en: 'No bot strategy defined' }) : undefined}
          >
            <input
              type="radio"
              name="difficulty"
              className="sr-only"
              checked={v.originalIndex === selectedIndex}
              onChange={() => onSelect(v.originalIndex)}
              disabled={v.disabled || fieldsetDisabled}
            />
            {t(v.label ?? { hu: `${v.originalIndex + 1}. szint`, en: `Level ${v.originalIndex + 1}` })}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const ModeSelector = ({ isHumanVsHumanGame, onSwitchMode, disabled }) => {
  const { t } = useTranslation();
  const labelClass = (active) => `grow py-1 px-2 text-center
    ${active
      ? `bg-blue-500 text-white font-semibold ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`
      : disabled
        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-600'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'}`;
  return (
    <fieldset>
      <legend className="text-xs text-slate-500 mb-1.5">
        {t({ hu: 'Játékmód', en: 'Game mode' })}
      </legend>
      <div className={`flex rounded-lg overflow-hidden border border-slate-300 text-sm
        has-focus-visible:ring-2 has-focus-visible:ring-red-400 has-focus-visible:ring-offset-1`}>
        <label className={labelClass(!isHumanVsHumanGame)}>
          <input
            type="radio"
            name="mode"
            className="sr-only"
            data-testid="mode-vsComputer"
            checked={!isHumanVsHumanGame}
            onChange={() => onSwitchMode('vsComputer')}
            disabled={disabled}
          />
          🤖 {t({ hu: 'Gép ellen', en: 'vs Computer' })}
        </label>
        <label className={labelClass(isHumanVsHumanGame)}>
          <input
            type="radio"
            name="mode"
            className="sr-only"
            data-testid="mode-vsHuman"
            checked={isHumanVsHumanGame}
            onChange={() => onSwitchMode('vsHuman')}
            disabled={disabled}
          />
          🤝 {t({ hu: '2 játékos', en: '2 players' })}
        </label>
      </div>
    </fieldset>
  );
};

const PlayerTurnPanel = ({ ctx }) => {
  const { t } = useTranslation();
  const playerName = (i) => ctx.playerNames[i] || t(DEFAULT_PLAYER_NAMES[i]);
  const isEnd = ctx.phase === 'gameEnd';

  return (
    <div className="flex flex-col gap-1">
      {[0, 1].map(i => {
        const isActive = !isEnd && ctx.currentPlayer === i;
        const isWinner = isEnd && ctx.winnerIndex === i;
        const colors = PLAYER_COLORS[i];
        return (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-md px-3 py-2 border-l-4
              ${isActive || isWinner ? `${colors.bg} ${colors.border}` : 'bg-white border-slate-200'}`}
          >
            <span className={`flex-1 ${isActive || isWinner ? `font-bold ${colors.text}` : 'text-slate-400'}`}>
              {playerName(i)}
            </span>
            {isWinner && <span>🏆</span>}
          </div>
        );
      })}
    </div>
  );
};

export const getCtaText = ({
  phase,
  isHumanVsHumanGame,
  isClientMoveAllowed,
  isRoleSelectorWinner,
  currentPlayerName,
  winnerName
}) => {
  if (phase === 'roleSelection') {
    return isHumanVsHumanGame
      ? { hu: 'Döntsétek el, hogy ki kezd.', en: 'Decide who goes first.' }
      : { hu: 'Válassz szerepet, utána indul a játék!', en: 'Choose a role to start the game!' };
  }
  if (phase === 'play') {
    return isHumanVsHumanGame
      ? { hu: `Következik: ${currentPlayerName}`, en: `Next: ${currentPlayerName}` }
      : isClientMoveAllowed
        ? { hu: 'Te jössz', en: 'Your turn' }
        : { hu: 'Mi jövünk', en: "Computer's turn" };
  }
  if (phase === 'gameEnd') {
    return isHumanVsHumanGame
      ? { hu: `A játékot nyerte: ${winnerName}`, en: `Winner: ${winnerName}` }
      : isRoleSelectorWinner
        ? { hu: 'Nyertél. Gratulálunk! :)', en: 'You won. Congratulations! :)' }
        : {
          hu: 'Sajnos, most nem nyertél, de ne add fel.',
          en: "Unfortunately you didn't win this time, but don't give up."
        };
  }
};
