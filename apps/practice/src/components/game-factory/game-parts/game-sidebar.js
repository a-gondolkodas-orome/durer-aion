import React from 'react';
import { Label, Field, Input } from '@headlessui/react';
import { useTranslation } from '../../language/translate';
import { ModeSelector, DifficultySelector, getCtaText, DEFAULT_PLAYER_NAMES } from './game-controls';

export const GameSidebar = ({
  roleLabels,
  stepDescription,
  ctx,
  gameEndDisplayCtx,
  moves,
  variants,
  selectedVariantIndex,
  stats,
  onResetStats
}) => {
  const { t } = useTranslation();
  const isNewGameAllowed = ctx.phase !== 'play' || ctx.isClientMoveAllowed;
  const activeVariantHasBotStrategy = !!variants.find(v => v.originalIndex === selectedVariantIndex)?.botStrategy;

  const selectedVariant = variants.find(v => v.originalIndex === selectedVariantIndex);
  const modeSummaryLabel = t(ctx.isHumanVsHumanGame
    ? { hu: '🤝 2 játékos', en: '🤝 2 players' }
    : { hu: '🤖 Gép ellen', en: '🤖 vs Computer' }
  );
  const defaultVariantLabel = { hu: `${selectedVariantIndex + 1}. szint`, en: `Level ${selectedVariantIndex + 1}` };
  const variantSummaryLabel = variants.length > 1
    ? ' · ' + t(selectedVariant?.label ?? defaultVariantLabel)
    : '';

  function ModeDifficultySelectors() {
    return (
      <>
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
      </>
    );
  }

  const displayCtx = gameEndDisplayCtx ?? ctx;

  return (
    <div className="p-2 flex flex-col grow shrink-0 basis-64 gap-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-8 flex flex-col gap-3">
        {displayCtx.isHumanVsHumanGame && ctx.phase !== 'roleSelection'
          ? <PlayerTurnPanel ctx={ctx} />
          : <p className="text-center font-bold text-lg">{t(getCtaText(displayCtx))}</p>
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

      <div className="mt-auto flex flex-col gap-3">
        {ctx.phase !== 'play' ? <ModeDifficultySelectors /> : (
          <details className="border border-slate-200 rounded-lg p-2 text-sm">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
              {modeSummaryLabel}{variantSummaryLabel}
            </summary>
            <div className="mt-2 flex flex-col gap-3">
              <ModeDifficultySelectors />
            </div>
          </details>
        )}

        <button
          className={`rounded-lg py-1.5 px-4 w-full text-center border
            border-slate-300 text-slate-600 hover:bg-slate-50 focus:bg-slate-50
            disabled:opacity-40 disabled:cursor-not-allowed`}
          disabled={!isNewGameAllowed}
          onClick={() => moves.resetGameState()}
        >
          {t({ hu: 'Új játék', en: 'New game' })}
        </button>
      </div>
      {!ctx.isHumanVsHumanGame && stats && (
        <WinLossCounter stats={stats} onReset={onResetStats} />
      )}
    </div>
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
  <div
    role="status" aria-label="Loading"
    className="animate-spin h-8 w-8 border-t-blue-600 rounded-full border-4"
  ></div>
);

const PlayerTurnPanel = ({ ctx }) => {
  const { t } = useTranslation();
  const playerName = (i) => ctx.playerNames[i] || t(DEFAULT_PLAYER_NAMES[i]);
  const isEnd = ctx.phase === 'gameEnd';

  return (
    <div className="flex flex-col gap-1" aria-live="polite">
      {[0, 1].map(i => {
        const isActive = !isEnd && ctx.currentPlayer === i;
        const isWinner = isEnd && ctx.winnerIndex === i;
        const highlighted = isActive || isWinner;
        return (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-md px-3 py-2 border-l-4
              ${highlighted ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200'}`}
          >
            <span className={`flex-1 ${highlighted ? 'font-bold text-blue-700' : 'text-slate-400'}`}>
              {playerName(i)}
            </span>
            {isWinner && <span>🏆</span>}
          </div>
        );
      })}
    </div>
  );
};

const WinLossCounter = ({ stats, onReset }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between text-sm text-slate-500">
      <span title={t({
        hu: `Megnyert játékok: ${stats.win}, Elvesztett játékok: ${stats.loss}`,
        en: `Wins: ${stats.win}, Losses: ${stats.loss}`
      })}>
        🏆 {stats.win} · 💀 {stats.loss}
      </span>
      <button
        onClick={onReset}
        aria-label={t({ hu: 'Számlálók nullázása', en: 'Reset counters' })}
        className="text-xs hover:text-slate-700"
      >
        ↻
      </button>
    </div>
  );
};
